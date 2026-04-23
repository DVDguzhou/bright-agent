package lifeagent

// Embedding 层（RAG/情景检索的向量脚手架）。
//
// 目标：
//   1. 对外只暴露 Embedder 接口 + 向量工具函数，具体调用封装在这里，
//      业务层（RAG、情景召回、回填）不关心到底是哪家的模型。
//   2. 百炼/DashScope 的 compatible-mode 与 OpenAI /embeddings 格式一致，
//      所以一份 HTTP 实现即可覆盖二者。
//   3. 句子级缓存：RAG 场景里同一个 query 会被多次 embed（召回 + 重排 + 改写），
//      用一个轻量 LRU 做去重，降 API 成本。
//
// 设计取舍：
//   - 不存 float64；text-embedding-v3 默认 1024 维，用 float32 小端序列化进
//     MySQL mediumblob，一条约 4KB，体积和精度都够用。
//   - 失败策略：任一环节出错（没 Key、网络错误、反序列化失败）都返回 err，
//     由上层决定"退化为纯词法检索"还是"放弃这次检索"，不在这里打补丁。

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
)

// Embedder 封装一次批量向量化调用。
type Embedder interface {
	// Embed 返回与 inputs 一一对应的向量切片。
	// 空字符串会被 padding 成零向量，避免索引错位。
	Embed(ctx context.Context, inputs []string) ([][]float32, error)
	// Model 当前模型名，用于回填时写入 embed_model 列，保证未来换模型可识别旧数据。
	Model() string
	// Dim 输出维度（text-embedding-v3 默认 1024）。
	Dim() int
}

// NewEmbedderFromConfig 按 cfg 构造一个可用的 Embedder；
// 任何必需字段缺失都返回 nil（调用方用 nil 判断是否降级）。
func NewEmbedderFromConfig(cfg *config.Config) Embedder {
	if cfg == nil || !cfg.EmbeddingEnabled() {
		return nil
	}
	dim := cfg.EmbeddingDim
	if dim <= 0 {
		dim = 1024
	}
	return &httpEmbedder{
		apiKey:  cfg.EmbeddingEffectiveKey(),
		baseURL: strings.TrimRight(cfg.EmbeddingBaseURL, "/"),
		model:   cfg.EmbeddingModel,
		dim:     dim,
		httpc:   dashScopeHTTPClient, // 复用已有连接池
	}
}

type httpEmbedder struct {
	apiKey  string
	baseURL string
	model   string
	dim     int
	httpc   *http.Client
}

func (e *httpEmbedder) Model() string { return e.model }
func (e *httpEmbedder) Dim() int      { return e.dim }

// Embed 对空输入直接返回空；对 >1024 文本按 64 一批切分，避免 DashScope 侧单次请求上限。
func (e *httpEmbedder) Embed(ctx context.Context, inputs []string) ([][]float32, error) {
	if len(inputs) == 0 {
		return nil, nil
	}
	if e.apiKey == "" {
		return nil, errors.New("embedder: missing api key")
	}

	const batch = 25 // 百炼对单次 input 长度有限制，保守分批
	out := make([][]float32, 0, len(inputs))
	for i := 0; i < len(inputs); i += batch {
		end := i + batch
		if end > len(inputs) {
			end = len(inputs)
		}
		chunk := inputs[i:end]

		// 命中缓存的直接填，未命中的凑一批发请求
		missIdx := make([]int, 0, len(chunk))
		results := make([][]float32, len(chunk))
		for j, text := range chunk {
			if v, ok := embedCacheGet(e.model, text); ok {
				results[j] = v
				continue
			}
			missIdx = append(missIdx, j)
		}
		if len(missIdx) > 0 {
			toEmbed := make([]string, len(missIdx))
			for k, idx := range missIdx {
				toEmbed[k] = sanitizeEmbedInput(chunk[idx])
			}
			vecs, err := e.callRemote(ctx, toEmbed)
			if err != nil {
				return nil, err
			}
			if len(vecs) != len(toEmbed) {
				return nil, fmt.Errorf("embedder: response mismatch got=%d want=%d", len(vecs), len(toEmbed))
			}
			for k, idx := range missIdx {
				results[idx] = vecs[k]
				embedCachePut(e.model, chunk[idx], vecs[k])
			}
		}
		out = append(out, results...)
	}
	return out, nil
}

type embeddingsReq struct {
	Model          string   `json:"model"`
	Input          []string `json:"input"`
	EncodingFormat string   `json:"encoding_format,omitempty"`
	Dimensions     int      `json:"dimensions,omitempty"`
}

type embeddingsResp struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
	Model string `json:"model"`
}

func (e *httpEmbedder) callRemote(ctx context.Context, inputs []string) ([][]float32, error) {
	reqBody := embeddingsReq{
		Model:          e.model,
		Input:          inputs,
		EncodingFormat: "float",
		Dimensions:     e.dim,
	}
	buf, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("embedder: marshal: %w", err)
	}
	url := e.baseURL + "/embeddings"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(buf))
	if err != nil {
		return nil, fmt.Errorf("embedder: new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+e.apiKey)

	resp, err := e.httpc.Do(req)
	if err != nil {
		return nil, fmt.Errorf("embedder: http do: %w", err)
	}
	defer resp.Body.Close()
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("embedder: read body: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embedder: status=%d body=%s", resp.StatusCode, truncate(string(bodyBytes), 400))
	}
	var parsed embeddingsResp
	if err := json.Unmarshal(bodyBytes, &parsed); err != nil {
		return nil, fmt.Errorf("embedder: unmarshal: %w", err)
	}
	out := make([][]float32, len(inputs))
	for _, d := range parsed.Data {
		if d.Index < 0 || d.Index >= len(out) {
			continue
		}
		out[d.Index] = d.Embedding
	}
	for i := range out {
		if out[i] == nil {
			// 某些情况下提供方按顺序返回但无 Index；兜底按顺序填
			if i < len(parsed.Data) {
				out[i] = parsed.Data[i].Embedding
			}
		}
	}
	return out, nil
}

// sanitizeEmbedInput DashScope 不接受纯空字符串，需要 fallback 成一个占位 token。
func sanitizeEmbedInput(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return "（空）"
	}
	// 控制长度，避免超 token 限制。text-embedding-v3 单条 8k token，
	// 保守按 4000 字符截断（中英混合约 2000-4000 token）。
	if len([]rune(s)) > 4000 {
		r := []rune(s)
		return string(r[:4000])
	}
	return s
}

// --- 向量工具 ---

// EncodeVector 把 float32 向量序列化成 mediumblob 可存储的字节串。
// 小端序，4 字节/维，跨平台稳定。
func EncodeVector(v []float32) []byte {
	if len(v) == 0 {
		return nil
	}
	buf := make([]byte, 4*len(v))
	for i, f := range v {
		binary.LittleEndian.PutUint32(buf[i*4:], math.Float32bits(f))
	}
	return buf
}

// DecodeVector 反序列化；非 4 字节倍数或空返回 nil。
func DecodeVector(b []byte) []float32 {
	if len(b) == 0 || len(b)%4 != 0 {
		return nil
	}
	v := make([]float32, len(b)/4)
	for i := range v {
		v[i] = math.Float32frombits(binary.LittleEndian.Uint32(b[i*4:]))
	}
	return v
}

// CosineSim 余弦相似度；长度不一致或全零返回 0。
func CosineSim(a, b []float32) float32 {
	if len(a) == 0 || len(a) != len(b) {
		return 0
	}
	var dot, na, nb float64
	for i := range a {
		af := float64(a[i])
		bf := float64(b[i])
		dot += af * bf
		na += af * af
		nb += bf * bf
	}
	if na == 0 || nb == 0 {
		return 0
	}
	return float32(dot / (math.Sqrt(na) * math.Sqrt(nb)))
}

// NormalizeCosine 把 [-1,1] 的余弦归一化到 [0,1]，便于和 lexical 分加权融合。
func NormalizeCosine(cos float32) float64 {
	return (float64(cos) + 1) / 2
}

// --- 句级 LRU 缓存（进程内） ---

type embedCacheEntry struct {
	vec     []float32
	addedAt time.Time
}

var (
	embedCacheMu   sync.Mutex
	embedCacheMap  = make(map[string]embedCacheEntry, 512)
	embedCacheCap  = 512
)

func embedCacheKey(model, text string) string {
	h := sha1.Sum([]byte(model + "\x00" + text))
	return hex.EncodeToString(h[:])
}

func embedCacheGet(model, text string) ([]float32, bool) {
	k := embedCacheKey(model, text)
	embedCacheMu.Lock()
	defer embedCacheMu.Unlock()
	e, ok := embedCacheMap[k]
	if !ok {
		return nil, false
	}
	return e.vec, true
}

func embedCachePut(model, text string, vec []float32) {
	if len(vec) == 0 {
		return
	}
	k := embedCacheKey(model, text)
	embedCacheMu.Lock()
	defer embedCacheMu.Unlock()
	// 粗粒度淘汰：满了就挑最早加入的 32 条清掉，避免无限膨胀也不必严格 LRU。
	if len(embedCacheMap) >= embedCacheCap {
		type kt struct {
			k string
			t time.Time
		}
		scratch := make([]kt, 0, len(embedCacheMap))
		for kk, vv := range embedCacheMap {
			scratch = append(scratch, kt{kk, vv.addedAt})
		}
		// 粗略按时间排序；冒泡足够用（cap 不大）
		for i := 0; i < 32 && i < len(scratch); i++ {
			for j := i + 1; j < len(scratch); j++ {
				if scratch[j].t.Before(scratch[i].t) {
					scratch[i], scratch[j] = scratch[j], scratch[i]
				}
			}
			delete(embedCacheMap, scratch[i].k)
		}
	}
	embedCacheMap[k] = embedCacheEntry{vec: vec, addedAt: time.Now()}
}

