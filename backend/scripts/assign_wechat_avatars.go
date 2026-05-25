// 为所有人生 Agent 下载不重复的「微信风格」头像到 uploads，并写入 cover_image_url。
//
// 在 backend 目录执行（需 DATABASE_URL，与 seed 相同）：
//
//	go run ./scripts/assign_wechat_avatars.go
//	go run ./scripts/assign_wechat_avatars.go --apply
//	LIMIT=20 go run ./scripts/assign_wechat_avatars.go --apply
//
// 生产 Docker 宿主机示例（~/regr）：
//
//	cd backend && go run ./scripts/assign_wechat_avatars.go --apply
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

const (
	maxAvatarBytes = 2 * 1024 * 1024
	minAvatarBytes = 256
)

var dicebearStyles = []string{
	"lorelei", "micah", "adventurer", "avataaars", "fun-emoji", "notionists", "personas", "big-smile",
}

type xxapiResp struct {
	Data string `json:"data"`
}

func main() {
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	apply := false
	for _, arg := range os.Args[1:] {
		if arg == "--apply" {
			apply = true
		}
	}

	limit := 0
	if v := strings.TrimSpace(os.Getenv("LIMIT")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}

	coverDir := strings.TrimSpace(os.Getenv("LIFE_AGENT_COVER_DIR"))
	if coverDir == "" {
		coverDir = filepath.Join(".", "uploads", "life-agent-covers")
	}
	if apply {
		if err := os.MkdirAll(coverDir, 0o755); err != nil {
			log.Fatal("mkdir:", err)
		}
	}

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatal("dsn:", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatal("db init:", err)
	}

	var profiles []models.LifeAgentProfile
	q := db.DB.Order("created_at ASC")
	if limit > 0 {
		q = q.Limit(limit)
	}
	if err := q.Find(&profiles).Error; err != nil {
		log.Fatal("query:", err)
	}

	client := &http.Client{Timeout: 25 * time.Second}
	used := make(map[string]struct{})
	ok, fail := 0, 0

	fmt.Printf("agents=%d mode=%s coverDir=%s\n", len(profiles), modeLabel(apply), coverDir)

	for _, p := range profiles {
		img, source, ext, err := downloadUniqueAvatar(client, p.ID, used)
		if err != nil {
			fail++
			log.Printf("FAIL %s (%s): %v", p.DisplayName, p.ID, err)
			continue
		}
		ok++

		filename := fmt.Sprintf("wx-%s%s", strings.ReplaceAll(p.ID, "-", "")[:24], ext)
		apiPath := "/api/upload/life-agent-cover/" + filename
		fmt.Printf("OK   %s -> %s [%s]\n", p.DisplayName, apiPath, truncate(source, 72))

		if !apply {
			continue
		}

		fullPath := filepath.Join(coverDir, filename)
		if err := os.WriteFile(fullPath, img, 0o644); err != nil {
			log.Printf("write %s: %v", fullPath, err)
			fail++
			ok--
			continue
		}
		res := db.DB.Model(&models.LifeAgentProfile{}).Where("id = ?", p.ID).Updates(map[string]interface{}{
			"cover_image_url":  apiPath,
			"cover_preset_key": nil,
		})
		if res.Error != nil {
			log.Printf("update %s: %v", p.ID, res.Error)
		}
	}

	fmt.Printf("\ndone success=%d failed=%d unique_images=%d\n", ok, fail, len(used))
	if !apply {
		fmt.Println("dry run only. Re-run with: go run ./scripts/assign_wechat_avatars.go --apply")
	}
}

func modeLabel(apply bool) string {
	if apply {
		return "APPLY"
	}
	return "DRY_RUN"
}

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "…"
}

func digest(buf []byte) string {
	sum := sha256.Sum256(buf)
	return hex.EncodeToString(sum[:])
}

func hashPick(seed string, mod int) int {
	sum := sha256.Sum256([]byte(seed))
	n := uint64(sum[0])<<56 | uint64(sum[1])<<48 | uint64(sum[2])<<40 | uint64(sum[3])<<32 |
		uint64(sum[4])<<24 | uint64(sum[5])<<16 | uint64(sum[6])<<8 | uint64(sum[7])
	if mod <= 0 {
		return 0
	}
	return int(n % uint64(mod))
}

func downloadUniqueAvatar(client *http.Client, agentID string, used map[string]struct{}) ([]byte, string, string, error) {
	for i := 0; i < 6; i++ {
		url, err := fetchXxapiHeadURL(client)
		if err != nil {
			continue
		}
		buf, err := downloadImage(client, url)
		if err != nil {
			continue
		}
		d := digest(buf)
		if _, dup := used[d]; dup {
			continue
		}
		used[d] = struct{}{}
		return buf, url, extFromURL(url, ".jpg"), nil
	}

	for attempt := 0; attempt < 8; attempt++ {
		for _, url := range []string{
			dicebearURL(agentID, attempt),
			randomUserURL(agentID, attempt),
		} {
			buf, err := downloadImage(client, url)
			if err != nil {
				continue
			}
			d := digest(buf)
			if _, dup := used[d]; dup {
				continue
			}
			used[d] = struct{}{}
			return buf, url, extFromURL(url, ".png"), nil
		}
	}
	return nil, "", "", fmt.Errorf("no unique avatar downloaded")
}

func fetchXxapiHeadURL(client *http.Client) (string, error) {
	req, err := http.NewRequest(http.MethodGet, "https://v2.xxapi.cn/api/head?return=json", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", "BrightAgentAvatarBot/1.0")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("xxapi status %d", resp.StatusCode)
	}
	var out xxapiResp
	if err := json.NewDecoder(resp.Body).Decode(&out); err != nil {
		return "", err
	}
	if !strings.HasPrefix(out.Data, "http") {
		return "", fmt.Errorf("xxapi bad data")
	}
	return out.Data, nil
}

func dicebearURL(agentID string, attempt int) string {
	style := dicebearStyles[hashPick(agentID+":"+strconv.Itoa(attempt), len(dicebearStyles))]
	seed := fmt.Sprintf("wx-%s-%d", agentID, attempt)
	return fmt.Sprintf("https://api.dicebear.com/9.x/%s/png?seed=%s&size=400", style, seed)
}

func randomUserURL(agentID string, attempt int) string {
	gender := "women"
	if hashPick(agentID+":"+strconv.Itoa(attempt)+":g", 2) == 1 {
		gender = "men"
	}
	idx := hashPick(agentID+":"+strconv.Itoa(attempt)+":i", 100)
	return fmt.Sprintf("https://randomuser.me/api/portraits/%s/%d.jpg", gender, idx)
}

func downloadImage(client *http.Client, url string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "image/*")
	req.Header.Set("User-Agent", "BrightAgentAvatarBot/1.0")
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status %d", resp.StatusCode)
	}
	ct := resp.Header.Get("Content-Type")
	if !strings.HasPrefix(ct, "image/") {
		return nil, fmt.Errorf("not image: %s", ct)
	}
	buf, err := io.ReadAll(io.LimitReader(resp.Body, maxAvatarBytes+1))
	if err != nil {
		return nil, err
	}
	if len(buf) < minAvatarBytes || len(buf) > maxAvatarBytes {
		return nil, fmt.Errorf("bad size %d", len(buf))
	}
	return buf, nil
}

func extFromURL(url, fallback string) string {
	lower := strings.ToLower(url)
	switch {
	case strings.Contains(lower, ".jpg"), strings.Contains(lower, ".jpeg"):
		return ".jpg"
	case strings.Contains(lower, ".webp"):
		return ".webp"
	case strings.Contains(lower, ".png"):
		return ".png"
	default:
		return fallback
	}
}
