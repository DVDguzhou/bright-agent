// set-user-cover-from-file：上传本地图片并设为用户头像（同步其名下的 Agent 封面）。
//
// 本地 dry-run（backend 目录）：
//   go run ./cmd/set-user-cover-from-file -file ../public/life-agent-cover-presets/nightowl-cat.png -target-email tmxiand@gmail.com
//
// 生产（经 API 上传到 backend 存储，立即生效）：
//   go run ./cmd/set-user-cover-from-file -file ../public/life-agent-cover-presets/nightowl-cat.png \
//     -target-email tmxiand@gmail.com -api-base https://brightagent.cn \
//     -api-email tmxiand@gmail.com -api-password '***' -also-agent "凌晨四点半" -apply
package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"net/url"

	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/joho/godotenv"
)

func applyAvatarBinding(userID, coverURL string) error {
	coverURL = strings.TrimSpace(coverURL)
	var userUpdate interface{}
	if coverURL == "" {
		userUpdate = nil
	} else {
		userUpdate = coverURL
	}
	if err := db.DB.Model(&models.User{}).Where("id = ?", userID).Update("avatar_url", userUpdate).Error; err != nil {
		return err
	}
	updates := map[string]interface{}{
		"cover_preset_key": nil,
	}
	if coverURL == "" {
		updates["cover_image_url"] = nil
	} else {
		updates["cover_image_url"] = coverURL
	}
	return db.DB.Model(&models.LifeAgentProfile{}).Where("user_id = ?", userID).Updates(updates).Error
}

func applyAgentCover(agentName, coverURL string) error {
	name := strings.TrimSpace(agentName)
	if name == "" {
		return nil
	}
	updates := map[string]interface{}{
		"cover_image_url":  strings.TrimSpace(coverURL),
		"cover_preset_key": nil,
	}
	res := db.DB.Model(&models.LifeAgentProfile{}).Where("display_name = ?", name).Updates(updates)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return fmt.Errorf("未找到 Agent %q", name)
	}
	return nil
}

func uploadViaAPI(baseURL, email, password, filePath string) (string, error) {
	baseURL = strings.TrimRight(strings.TrimSpace(baseURL), "/")
	email = strings.TrimSpace(email)
	password = strings.TrimSpace(password)

	loginBody, _ := json.Marshal(map[string]string{"email": email, "password": password})
	loginReq, err := http.NewRequest(http.MethodPost, baseURL+"/api/auth/login", bytes.NewReader(loginBody))
	if err != nil {
		return "", err
	}
	loginReq.Header.Set("Content-Type", "application/json")

	jar := &cookieJar{cookies: map[string][]*http.Cookie{}}
	client := &http.Client{Jar: jar}

	loginResp, err := client.Do(loginReq)
	if err != nil {
		return "", fmt.Errorf("login request: %w", err)
	}
	defer loginResp.Body.Close()
	if loginResp.StatusCode != http.StatusOK {
		b, _ := io.ReadAll(loginResp.Body)
		return "", fmt.Errorf("login failed (%d): %s", loginResp.StatusCode, strings.TrimSpace(string(b)))
	}

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	part, err := w.CreateFormFile("file", filepath.Base(filePath))
	if err != nil {
		return "", err
	}
	in, err := os.Open(filePath)
	if err != nil {
		return "", err
	}
	defer in.Close()
	if _, err := io.Copy(part, in); err != nil {
		return "", err
	}
	if err := w.Close(); err != nil {
		return "", err
	}

	upReq, err := http.NewRequest(http.MethodPost, baseURL+"/api/upload/life-agent-cover", &buf)
	if err != nil {
		return "", err
	}
	upReq.Header.Set("Content-Type", w.FormDataContentType())

	upResp, err := client.Do(upReq)
	if err != nil {
		return "", fmt.Errorf("upload request: %w", err)
	}
	defer upResp.Body.Close()
	body, _ := io.ReadAll(upResp.Body)
	if upResp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("upload failed (%d): %s", upResp.StatusCode, strings.TrimSpace(string(body)))
	}
	var parsed struct {
		URL string `json:"url"`
	}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return "", err
	}
	url := strings.TrimSpace(parsed.URL)
	if url == "" {
		return "", fmt.Errorf("upload response missing url")
	}
	return url, nil
}

type cookieJar struct {
	cookies map[string][]*http.Cookie
}

func (j *cookieJar) SetCookies(u *url.URL, cookies []*http.Cookie) {
	j.cookies[u.Host] = cookies
}

func (j *cookieJar) Cookies(u *url.URL) []*http.Cookie {
	return j.cookies[u.Host]
}

func main() {
	filePath := flag.String("file", "", "本地图片路径")
	targetEmail := flag.String("target-email", "", "目标用户邮箱")
	coverURL := flag.String("cover-url", "", "直接指定封面 URL（跳过上传）")
	apiBase := flag.String("api-base", "", "生产 API 根地址，如 https://brightagent.cn")
	apiEmail := flag.String("api-email", "", "上传用登录邮箱")
	apiPassword := flag.String("api-password", "", "上传用登录密码")
	alsoAgent := flag.String("also-agent", "", "额外更新指定 Agent 的封面 display_name")
	apply := flag.Bool("apply", false, "写库/上传（缺省 dry-run）")
	flag.Parse()

	if strings.TrimSpace(*targetEmail) == "" {
		log.Fatal("需要 -target-email")
	}

	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	dsn, err := db.DSNFromEnv()
	if err != nil {
		log.Fatalf("dsn: %v", err)
	}
	if err := db.Init(dsn); err != nil {
		log.Fatalf("db init: %v", err)
	}

	var user models.User
	if err := db.DB.Where("email = ?", strings.TrimSpace(*targetEmail)).First(&user).Error; err != nil {
		log.Fatalf("未找到用户 email=%q: %v", *targetEmail, err)
	}

	finalURL := strings.TrimSpace(*coverURL)
	if finalURL == "" {
		fp := strings.TrimSpace(*filePath)
		if fp == "" {
			log.Fatal("需要 -file 或 -cover-url")
		}
		if _, err := os.Stat(fp); err != nil {
			log.Fatalf("文件不存在: %v", err)
		}
		if strings.TrimSpace(*apiBase) != "" {
			if !*apply {
				fmt.Printf("[dry-run] 将上传到 %s\n", *apiBase)
			} else {
				finalURL, err = uploadViaAPI(*apiBase, *apiEmail, *apiPassword, fp)
				if err != nil {
					log.Fatalf("上传失败: %v", err)
				}
			}
		} else {
			finalURL = "/life-agent-cover-presets/" + filepath.Base(fp)
		}
	}

	var agentCount int64
	db.DB.Model(&models.LifeAgentProfile{}).Where("user_id = ?", user.ID).Count(&agentCount)

	fmt.Printf("=== 设置用户封面 ===\n")
	fmt.Printf("目标用户:   %s <%s> (id=%s)\n", ptrStr(user.Name), user.Email, user.ID)
	fmt.Printf("当前头像:   %s\n", ptrStr(user.AvatarURL))
	fmt.Printf("新封面 URL: %s\n", finalURL)
	fmt.Printf("名下 Agent: %d 个（将同步封面）\n", agentCount)
	if strings.TrimSpace(*alsoAgent) != "" {
		fmt.Printf("额外 Agent: %s\n", strings.TrimSpace(*alsoAgent))
	}

	if !*apply {
		fmt.Println("\n[dry-run] 未写库。加 -apply 执行。")
		return
	}

	if err := applyAvatarBinding(user.ID, finalURL); err != nil {
		log.Fatalf("更新用户失败: %v", err)
	}
	if err := applyAgentCover(*alsoAgent, finalURL); err != nil {
		log.Fatalf("更新 Agent 失败: %v", err)
	}
	fmt.Println("\n✓ 已更新封面。")
}

func ptrStr(s *string) string {
	if s == nil {
		return "(null)"
	}
	t := strings.TrimSpace(*s)
	if t == "" {
		return "(empty)"
	}
	return t
}
