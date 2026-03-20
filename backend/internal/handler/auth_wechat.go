package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// WeChatRedirect 返回微信授权 URL，前端可跳转
func WeChatRedirect(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		appID := strings.TrimSpace(cfg.WeChatAppID)
		if appID == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "WECHAT_NOT_CONFIGURED"})
			return
		}
		redirectURI := strings.TrimSpace(cfg.WeChatRedirectURI)
		if redirectURI == "" {
			redirectURI = strings.TrimSuffix(cfg.BaseURL, "/") + "/api/auth/wechat/callback"
		}
		state := c.Query("state")
		if state == "" {
			state = "default"
		}
		authURL := "https://open.weixin.qq.com/connect/qrconnect?appid=" + url.QueryEscape(appID) +
			"&redirect_uri=" + url.QueryEscape(redirectURI) +
			"&response_type=code&scope=snsapi_login&state=" + url.QueryEscape(state) + "#wechat_redirect"
		c.JSON(http.StatusOK, gin.H{"url": authURL})
	}
}

// WeChatCallback 微信授权回调，用 code 换 openid 并登录
func WeChatCallback(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		code := strings.TrimSpace(c.Query("code"))
		if code == "" {
			redirectToLogin(c, cfg, "missing_code")
			return
		}
		appID := strings.TrimSpace(cfg.WeChatAppID)
		secret := strings.TrimSpace(cfg.WeChatAppSecret)
		if appID == "" || secret == "" {
			redirectToLogin(c, cfg, "wechat_not_configured")
			return
		}
		redirectURI := strings.TrimSpace(cfg.WeChatRedirectURI)
		if redirectURI == "" {
			redirectURI = strings.TrimSuffix(cfg.BaseURL, "/") + "/api/auth/wechat/callback"
		}

		tokenURL := "https://api.weixin.qq.com/sns/oauth2/access_token?appid=" + url.QueryEscape(appID) +
			"&secret=" + url.QueryEscape(secret) + "&code=" + url.QueryEscape(code) + "&grant_type=authorization_code"
		resp, err := http.Get(tokenURL)
		if err != nil {
			log.Printf("wechat oauth: get token: %v", err)
			redirectToLogin(c, cfg, "network_error")
			return
		}
		defer resp.Body.Close()
		var tokenResp struct {
			AccessToken  string `json:"access_token"`
			ExpiresIn    int    `json:"expires_in"`
			RefreshToken string `json:"refresh_token"`
			OpenID       string `json:"openid"`
			Scope        string `json:"scope"`
			UnionID      string `json:"unionid"`
			ErrCode      int    `json:"errcode"`
			ErrMsg       string `json:"errmsg"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
			log.Printf("wechat oauth: decode token: %v", err)
			redirectToLogin(c, cfg, "invalid_response")
			return
		}
		if tokenResp.ErrCode != 0 || tokenResp.OpenID == "" {
			log.Printf("wechat oauth: errcode=%d errmsg=%s", tokenResp.ErrCode, tokenResp.ErrMsg)
			redirectToLogin(c, cfg, "invalid_code")
			return
		}
		openID := tokenResp.OpenID

		var u models.User
		if err := db.DB.Where("wechat_open_id = ?", openID).First(&u).Error; err == nil {
			setSessionCookie(c, cfg, u.ID)
			redirectToFrontend(c, cfg, "")
			return
		}

		nickname := ""
		if tokenResp.AccessToken != "" {
			userInfoURL := "https://api.weixin.qq.com/sns/userinfo?access_token=" + url.QueryEscape(tokenResp.AccessToken) + "&openid=" + url.QueryEscape(openID) + "&lang=zh_CN"
			if infoResp, err := http.Get(userInfoURL); err == nil {
				var info struct {
					Nickname   string `json:"nickname"`
					HeadImgURL string `json:"headimgurl"`
					ErrCode    int    `json:"errcode"`
				}
				_ = json.NewDecoder(infoResp.Body).Decode(&info)
				infoResp.Body.Close()
				if info.ErrCode == 0 {
					nickname = strings.TrimSpace(info.Nickname)
					if nickname == "" {
						nickname = "微信用户"
					}
				}
			}
		}
		if nickname == "" {
			nickname = "微信用户"
		}

		placeholderEmail := "wechat_" + openID + "@placeholder.local"
		hash, _ := bcrypt.GenerateFromPassword([]byte(models.GenID()), 12)
		u = models.User{
			ID:           models.GenID(),
			Email:        placeholderEmail,
			Password:     string(hash),
			Name:         &nickname,
			WechatOpenID: &openID,
			RoleFlags:    nil,
		}
		if err := db.DB.Create(&u).Error; err != nil {
			log.Printf("wechat oauth: create user: %v", err)
			redirectToLogin(c, cfg, "create_failed")
			return
		}
		setSessionCookie(c, cfg, u.ID)
		redirectToFrontend(c, cfg, "")
	}
}

func frontendBase(c *gin.Context, cfg *config.Config) string {
	if base := strings.TrimSuffix(strings.TrimSpace(cfg.FrontendURL), "/"); base != "" {
		return base
	}
	scheme := c.GetHeader("X-Forwarded-Proto")
	if scheme == "" {
		scheme = c.Request.URL.Scheme
	}
	if scheme == "" {
		scheme = "https"
	}
	host := c.GetHeader("X-Forwarded-Host")
	if host == "" {
		host = c.Request.Host
	}
	return scheme + "://" + host
}

func redirectToLogin(c *gin.Context, cfg *config.Config, err string) {
	base := frontendBase(c, cfg)
	dest := base + "/login"
	if err != "" {
		dest += "?error=" + url.QueryEscape(err)
	}
	c.Redirect(http.StatusFound, dest)
}

func redirectToFrontend(c *gin.Context, cfg *config.Config, path string) {
	base := frontendBase(c, cfg)
	if path == "" {
		path = "/dashboard"
	}
	c.Redirect(http.StatusFound, base+path)
}
