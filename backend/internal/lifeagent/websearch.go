package lifeagent

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	openai "github.com/sashabaranov/go-openai"
)

// WebSearchSettings configures an external web search backend (Bocha or DashScope enable_search).
// Chat LLM may be DeepSeek/Gemini while search uses a separate provider/key.
type WebSearchSettings struct {
	Enabled          bool
	Provider         string // "bocha" | "dashscope"
	BochaAPIKey      string
	DashScopeAPIKey  string
	DashScopeModel   string
	DashScopeBaseURL string
}

// ResolveWebSearchSettings picks a provider from env-style inputs.
// provider: auto | bocha | dashscope | off
func ResolveWebSearchSettings(
	provider, bochaKey, dashScopeKey, webSearchAPIKey, webSearchModel, webSearchBaseURL,
	chatAPIKey, chatBaseURL, chatModel string,
	llmEnableWebSearch bool,
	embeddingKey string,
) WebSearchSettings {
	p := strings.ToLower(strings.TrimSpace(provider))
	switch p {
	case "off", "none", "false", "0":
		return WebSearchSettings{}
	case "", "auto":
		if resolveDashScopeSearchKey(dashScopeKey, webSearchAPIKey, embeddingKey, chatAPIKey, chatBaseURL) != "" {
			p = "dashscope"
		} else if k := strings.TrimSpace(bochaKey); k != "" {
			p = "bocha"
		} else if llmEnableWebSearch && isDashScope(chatBaseURL) && strings.TrimSpace(chatAPIKey) != "" {
			p = "dashscope"
		} else {
			return WebSearchSettings{}
		}
	}

	switch p {
	case "bocha":
		k := strings.TrimSpace(bochaKey)
		if k == "" {
			return WebSearchSettings{}
		}
		return WebSearchSettings{Enabled: true, Provider: "bocha", BochaAPIKey: k}
	case "dashscope":
		key := resolveDashScopeSearchKey(dashScopeKey, webSearchAPIKey, embeddingKey, chatAPIKey, chatBaseURL)
		if key == "" {
			return WebSearchSettings{}
		}
		model := strings.TrimSpace(webSearchModel)
		if model == "" {
			model = "qwen-plus"
		}
		base := strings.TrimSpace(webSearchBaseURL)
		if base == "" {
			base = "https://dashscope.aliyuncs.com/compatible-mode/v1"
		}
		return WebSearchSettings{
			Enabled:          true,
			Provider:         "dashscope",
			DashScopeAPIKey:  key,
			DashScopeModel:   model,
			DashScopeBaseURL: base,
		}
	default:
		return WebSearchSettings{}
	}
}

func resolveDashScopeSearchKey(dashScopeKey, webSearchAPIKey, embeddingKey, chatAPIKey, chatBaseURL string) string {
	if k := strings.TrimSpace(webSearchAPIKey); k != "" {
		return k
	}
	if k := strings.TrimSpace(dashScopeKey); k != "" {
		return k
	}
	if k := strings.TrimSpace(embeddingKey); k != "" {
		return k
	}
	if isDashScope(chatBaseURL) {
		return strings.TrimSpace(chatAPIKey)
	}
	return ""
}

// SearchWeb runs a query through the configured provider.
func SearchWeb(ctx context.Context, query string, cfg WebSearchSettings) (string, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return "", fmt.Errorf("empty query")
	}
	if !cfg.Enabled {
		return "", fmt.Errorf("web search not configured")
	}
	switch cfg.Provider {
	case "bocha":
		return searchBocha(ctx, query, cfg.BochaAPIKey)
	case "dashscope":
		return searchDashScope(ctx, query, cfg.DashScopeAPIKey, cfg.DashScopeModel, cfg.DashScopeBaseURL)
	default:
		return "", fmt.Errorf("unknown web search provider: %s", cfg.Provider)
	}
}

func searchDashScope(ctx context.Context, query, apiKey, model, baseURL string) (string, error) {
	messages := []openai.ChatCompletionMessage{
		{Role: openai.ChatMessageRoleSystem, Content: "你是搜索助手。根据用户问题检索最新公开信息，只返回简洁的事实性摘要，不要加入个人观点。"},
		{Role: openai.ChatMessageRoleUser, Content: query},
	}
	resp, err := chatCompletionWithWebSearch(ctx, apiKey, model, baseURL, messages)
	if err != nil {
		return "", err
	}
	if len(resp.Choices) == 0 || strings.TrimSpace(resp.Choices[0].Message.Content) == "" {
		return "", fmt.Errorf("no dashscope search results")
	}
	return strings.TrimSpace(resp.Choices[0].Message.Content), nil
}

const bochaWebSearchURL = "https://api.bochaai.com/v1/web-search"

func searchBocha(ctx context.Context, query, apiKey string) (string, error) {
	body := map[string]any{
		"query":     query,
		"freshness": "oneYear",
		"summary":   true,
		"count":     8,
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return "", err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, bochaWebSearchURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := dashScopeHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("bocha api error: status=%d body=%s", resp.StatusCode, truncateForLog(string(respBytes), 300))
	}
	text, err := formatBochaResults(respBytes)
	if err != nil {
		return "", err
	}
	if text == "" {
		return "", fmt.Errorf("no bocha search results")
	}
	return text, nil
}

func formatBochaResults(respBytes []byte) (string, error) {
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(respBytes, &raw); err != nil {
		return "", err
	}
	pages := extractBochaWebPages(raw)
	if len(pages) == 0 {
		return "", nil
	}
	var sb strings.Builder
	for i, p := range pages {
		if i >= 8 {
			break
		}
		title := strings.TrimSpace(p.Name)
		summary := strings.TrimSpace(p.Summary)
		if summary == "" {
			summary = strings.TrimSpace(p.Snippet)
		}
		url := strings.TrimSpace(p.URL)
		if title == "" && summary == "" {
			continue
		}
		if i > 0 {
			sb.WriteString("\n\n")
		}
		if title != "" {
			sb.WriteString(title)
		}
		if url != "" {
			if title != "" {
				sb.WriteString("（")
			}
			sb.WriteString(url)
			if title != "" {
				sb.WriteString("）")
			}
		}
		if summary != "" {
			if title != "" || url != "" {
				sb.WriteString("：")
			}
			sb.WriteString(summary)
		}
	}
	return strings.TrimSpace(sb.String()), nil
}

type bochaWebPage struct {
	Name    string `json:"name"`
	URL     string `json:"url"`
	Summary string `json:"summary"`
	Snippet string `json:"snippet"`
}

func extractBochaWebPages(raw map[string]json.RawMessage) []bochaWebPage {
	candidates := [][]byte{
		raw["data"],
		raw["webPages"],
	}
	for _, b := range candidates {
		if len(b) == 0 {
			continue
		}
		var wrapper struct {
			WebPages struct {
				Value []bochaWebPage `json:"value"`
			} `json:"webPages"`
		}
		if err := json.Unmarshal(b, &wrapper); err == nil && len(wrapper.WebPages.Value) > 0 {
			return wrapper.WebPages.Value
		}
		var direct struct {
			Value []bochaWebPage `json:"value"`
		}
		if err := json.Unmarshal(b, &direct); err == nil && len(direct.Value) > 0 {
			return direct.Value
		}
	}
	return nil
}

func injectWebSearchContext(knowledgeCtx, searchResult string, searchFailed bool) string {
	var block strings.Builder
	if searchFailed || strings.TrimSpace(searchResult) == "" {
		block.WriteString("【联网检索】本次未能获得可靠实时数据。必须明确告知用户需查阅省教育考试院、研招网等官方渠道核实；禁止编造分数线、位次、招生计划等具体数字；禁止说「搜着呢」「等一下」「等结果出来」「稍后发你」等假装正在异步搜索的话术。")
	} else {
		block.WriteString("【联网检索结果 - 回答必须以此为准】\n")
		block.WriteString(strings.TrimSpace(searchResult))
		block.WriteString("\n\n规则：检索已在回复生成前同步完成。必须直接根据以上内容作答；禁止说「搜着呢」「等一下」「等结果出来」「稍后发你」；若检索结果不足以回答，说明缺口并建议查官方渠道；禁止编造检索结果中不存在的具体数字。")
	}
	if strings.TrimSpace(knowledgeCtx) == "" {
		return block.String()
	}
	return block.String() + "\n\n" + knowledgeCtx
}

func webSearchDraftRules(forcedInjected bool, searchFailed bool) string {
	if forcedInjected && !searchFailed {
		return "【实时数据约束】系统已在生成回复前完成联网检索（见下方知识块）。第一句就要给结论或数据，禁止「搜着呢」「等结果」「稍等」「我查完发你」等拖延话术；检索块里没有的数字不要编。\n\n"
	}
	if forcedInjected && searchFailed {
		return "【实时数据约束】联网检索未拿到可靠结果。直接引导用户查省教育考试院/研招网官方渠道；禁止「搜着呢」「等一下」「稍后发你」等假装正在搜索。\n\n"
	}
	return "【实时数据约束】涉及分数线、位次、招生计划、录取政策等时效性事实时，必须调用 web_search 获取最新公开信息后再回答；未调用搜索或搜索失败时，不得编造具体数字，也不得声称「我刚搜了」或「搜着呢」。\n\n"
}

func truncateForLog(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max]) + "..."
}
