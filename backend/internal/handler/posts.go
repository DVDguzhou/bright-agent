package handler

import (
	"net/http"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
)

type postCreateReq struct {
	Content string `json:"content" binding:"required,min=1,max=2000"`
}

type postResponse struct {
	ID        string `json:"id"`
	Content   string `json:"content"`
	AuthorName string `json:"authorName"`
	AuthorEmail string `json:"authorEmail"`
	CreatedAt string `json:"createdAt"`
	Likes     int    `json:"likes"`
	LikedByMe bool   `json:"likedByMe"`
}

// PostsCreate 创建帖子
func PostsCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		var req postCreateReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
			return
		}

		post := models.Post{
			ID:        models.GenID(),
			UserID:    user.ID,
			Content:   req.Content,
			Likes:     0,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := db.DB.Create(&post).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "CREATE_FAILED"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"id": post.ID})
	}
}

// PostsList 获取帖子列表（公开，不需要登录）
func PostsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		var posts []models.Post
		if err := db.DB.Order("created_at DESC").Limit(100).Find(&posts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "QUERY_FAILED"})
			return
		}

		// 收集 user_ids 并批量查询用户信息
		userIDs := make([]string, 0, len(posts))
		for _, p := range posts {
			userIDs = append(userIDs, p.UserID)
		}

		var users []models.User
		userMap := make(map[string]models.User)
		if len(userIDs) > 0 {
			db.DB.Where("id IN ?", userIDs).Find(&users)
			for _, u := range users {
				userMap[u.ID] = u
			}
		}

		currentUser := middleware.MustGetUser(c)
		resp := make([]postResponse, 0, len(posts))
		for _, p := range posts {
			u, ok := userMap[p.UserID]
			authorName := "用户"
			authorEmail := ""
			if ok {
				if u.Name != nil && *u.Name != "" {
					authorName = *u.Name
				}
				authorEmail = u.Email
			}
			resp = append(resp, postResponse{
				ID:          p.ID,
				Content:     p.Content,
				AuthorName:  authorName,
				AuthorEmail: authorEmail,
				CreatedAt:   p.CreatedAt.Format(time.RFC3339),
				Likes:       p.Likes,
				LikedByMe:   false,
			})
		}

		_ = currentUser // 后续可扩展点赞功能
		c.JSON(http.StatusOK, gin.H{"items": resp})
	}
}
