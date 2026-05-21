package handler

import (
	"net/http"
	"strings"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/cookieutil"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/agent-marketplace/backend/internal/yantuseed"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

const deleteAccountConfirmToken = "DELETE"

// DeleteAccount 永久注销当前登录账号（App Store 5.1.1(v) 要求）。
func DeleteAccount(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		su := middleware.MustGetUser(c)
		if su == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}
		if su.ID == models.LifeAgentAPICallerUserID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}

		var body struct {
			Confirm  string `json:"confirm" binding:"required"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "VALIDATION_ERROR"})
			return
		}
		if strings.TrimSpace(body.Confirm) != deleteAccountConfirmToken {
			c.JSON(http.StatusBadRequest, gin.H{"error": "CONFIRM_REQUIRED"})
			return
		}

		var u models.User
		if err := db.DB.Where("id = ?", su.ID).First(&u).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		email := normalizeAuthEmail(u.Email)
		if !isPlaceholderAuthEmail(email) {
			if strings.TrimSpace(body.Password) == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "PASSWORD_REQUIRED"})
				return
			}
			if err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(body.Password)); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "WRONG_PASSWORD"})
				return
			}
		}

		if err := deleteUserAccountCascade(db.DB, u.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
			return
		}

		sec := cookieutil.SessionSecure(c, cfg)
		c.SetCookie(cfg.SessionCookie, "", -1, "/", "", sec, true)
		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

func deleteUserAccountCascade(tx *gorm.DB, userID string) error {
	return tx.Transaction(func(tx *gorm.DB) error {
		var profileIDs []string
		if err := tx.Model(&models.LifeAgentProfile{}).Where("user_id = ?", userID).Pluck("id", &profileIDs).Error; err != nil {
			return err
		}
		for _, pid := range profileIDs {
			if err := yantuseed.DeleteLifeAgentProfileCascade(tx, pid); err != nil {
				return err
			}
		}

		var buyerSessionIDs []string
		if err := tx.Model(&models.LifeAgentChatSession{}).Where("buyer_id = ?", userID).Pluck("id", &buyerSessionIDs).Error; err != nil {
			return err
		}
		if len(buyerSessionIDs) > 0 {
			if err := tx.Where("session_id IN ?", buyerSessionIDs).Delete(&models.LifeAgentChatMessage{}).Error; err != nil {
				return err
			}
			if err := tx.Where("session_id IN ?", buyerSessionIDs).Delete(&models.LifeAgentPerceptualTrace{}).Error; err != nil {
				return err
			}
			if err := tx.Where("session_id IN ?", buyerSessionIDs).Delete(&models.LifeAgentEpisode{}).Error; err != nil {
				return err
			}
			if err := tx.Where("buyer_id = ?", userID).Delete(&models.LifeAgentFeedback{}).Error; err != nil {
				return err
			}
			if err := tx.Where("buyer_id = ?", userID).Delete(&models.LifeAgentChatSession{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("buyer_id = ?", userID).Delete(&models.LifeAgentQuestionPack{}).Error; err != nil {
			return err
		}
		if err := tx.Where("buyer_id = ?", userID).Delete(&models.LifeAgentRating{}).Error; err != nil {
			return err
		}
		if err := tx.Where("buyer_id = ?", userID).Delete(&models.WechatPayOrder{}).Error; err != nil {
			return err
		}
		_ = tx.Exec("DELETE FROM life_agent_favorites WHERE user_id = ?", userID)
		if err := tx.Where("user_id = ?", userID).Delete(&models.LifeAgentCoEditState{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.UserApiKey{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.PostAgentConversationCount{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.PostLike{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&models.PostComment{}).Error; err != nil {
			return err
		}

		var postIDs []string
		if err := tx.Model(&models.Post{}).Where("user_id = ?", userID).Pluck("id", &postIDs).Error; err != nil {
			return err
		}
		if len(postIDs) > 0 {
			if err := tx.Where("post_id IN ?", postIDs).Delete(&models.PostLike{}).Error; err != nil {
				return err
			}
			if err := tx.Where("post_id IN ?", postIDs).Delete(&models.PostComment{}).Error; err != nil {
				return err
			}
			if err := tx.Where("post_id IN ?", postIDs).Delete(&models.PostAgentReply{}).Error; err != nil {
				return err
			}
			if err := tx.Where("id IN ?", postIDs).Delete(&models.Post{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("buyer_id = ? OR seller_id = ?", userID, userID).Delete(&models.License{}).Error; err != nil {
			return err
		}
		if err := tx.Where("buyer_id = ? OR seller_id = ?", userID, userID).Delete(&models.InvocationToken{}).Error; err != nil {
			return err
		}
		if err := tx.Where("buyer_id = ?", userID).Delete(&models.InvocationRequest{}).Error; err != nil {
			return err
		}

		var agentIDs []string
		if err := tx.Model(&models.Agent{}).Where("seller_id = ?", userID).Pluck("id", &agentIDs).Error; err != nil {
			return err
		}
		if len(agentIDs) > 0 {
			if err := tx.Where("id IN ?", agentIDs).Delete(&models.Agent{}).Error; err != nil {
				return err
			}
		}
		if err := tx.Where("seller_id = ?", userID).Delete(&models.Agent{}).Error; err != nil {
			return err
		}

		return tx.Where("id = ?", userID).Delete(&models.User{}).Error
	})
}
