package handler

import (
	"context"
	"log"
	"math/rand"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/db"
	"github.com/agent-marketplace/backend/internal/lifeagent"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/agent-marketplace/backend/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

var globalRand = rand.New(rand.NewSource(0))

// ---------- Request / Response types ----------

type postCreateReq struct {
	Content    string   `json:"content" binding:"required,min=1,max=2000"`
	Images     []string `json:"images"`
	Visibility string   `json:"visibility"` // public / private，缺省 public
}

type postUpdateReq struct {
	Content    string   `json:"content" binding:"required,min=1,max=2000"`
	Images     []string `json:"images"`
	Visibility *string  `json:"visibility"` // 可选：传入则更新可见性
}

type postResponse struct {
	ID              string   `json:"id"`
	Content         string   `json:"content"`
	Images          []string `json:"images"`
	Visibility      string   `json:"visibility"`
	AuthorName      string   `json:"authorName"`
	AuthorEmail     string   `json:"authorEmail"`
	AuthorID        string   `json:"authorId"`
	AuthorAvatarUrl string   `json:"authorAvatarUrl,omitempty"`
	CreatedAt       string   `json:"createdAt"`
	UpdatedAt       string   `json:"updatedAt"`
	Likes           int      `json:"likes"`
	CommentsCount   int      `json:"commentsCount"`
	LikedByMe       bool              `json:"likedByMe"`
	PreviewComments []commentResponse `json:"previewComments,omitempty"`
}

type commentResponse struct {
	ID              string `json:"id"`
	Content         string `json:"content"`
	AuthorName      string `json:"authorName"`
	AuthorID        string `json:"authorId"`
	AuthorAvatarUrl string `json:"authorAvatarUrl,omitempty"`
	CreatedAt       string `json:"createdAt"`
	IsAgentReply    bool   `json:"isAgentReply"`
	AgentName       string `json:"agentName,omitempty"`
	AgentID         string `json:"agentId,omitempty"`
	AgentCoverUrl   string `json:"agentCoverUrl,omitempty"`
}

type postDetailResponse struct {
	ID              string            `json:"id"`
	Content         string            `json:"content"`
	Images          []string          `json:"images"`
	Visibility      string            `json:"visibility"`
	AuthorName      string            `json:"authorName"`
	AuthorEmail     string            `json:"authorEmail"`
	AuthorID        string            `json:"authorId"`
	AuthorAvatarUrl string            `json:"authorAvatarUrl,omitempty"`
	CreatedAt       string            `json:"createdAt"`
	UpdatedAt       string            `json:"updatedAt"`
	Likes           int               `json:"likes"`
	CommentsCount   int               `json:"commentsCount"`
	LikedByMe       bool              `json:"likedByMe"`
	Comments        []commentResponse `json:"comments"`
	AgentReplies    []commentResponse `json:"agentReplies"`
}

// ---------- Helpers ----------

func buildUserMap(userIDs []string) map[string]models.User {
	userMap := make(map[string]models.User)
	if len(userIDs) == 0 {
		return userMap
	}
	var users []models.User
	db.DB.Where("id IN ?", userIDs).Find(&users)
	for _, u := range users {
		userMap[u.ID] = u
	}
	return userMap
}

func buildLifeAgentProfileMap(profileIDs []string) map[string]models.LifeAgentProfile {
	profileMap := make(map[string]models.LifeAgentProfile)
	if len(profileIDs) == 0 {
		return profileMap
	}
	var profiles []models.LifeAgentProfile
	db.DB.Where("id IN ?", profileIDs).Find(&profiles)
	for _, p := range profiles {
		profileMap[p.ID] = p
	}
	return profileMap
}

func authorNameFromUser(u models.User) string {
	if u.Name != nil && *u.Name != "" {
		return *u.Name
	}
	return "用户"
}

func likedPostIDs(userID string, postIDs []string) map[string]bool {
	liked := make(map[string]bool)
	if userID == "" || len(postIDs) == 0 {
		return liked
	}
	var likes []models.PostLike
	db.DB.Select("post_id").Where("user_id = ? AND post_id IN ?", userID, postIDs).Find(&likes)
	for _, l := range likes {
		liked[l.PostID] = true
	}
	return liked
}

func postIDsFromPosts(posts []models.Post) []string {
	ids := make([]string, 0, len(posts))
	for _, p := range posts {
		ids = append(ids, p.ID)
	}
	return ids
}

const postPreviewCommentsLimit = 3

type commentPreviewItem struct {
	createdAt time.Time
	resp      commentResponse
}

func buildPreviewCommentsForPosts(postIDs []string, limit int) map[string][]commentResponse {
	out := make(map[string][]commentResponse, len(postIDs))
	if len(postIDs) == 0 || limit <= 0 {
		return out
	}

	var comments []models.PostComment
	db.DB.Where("post_id IN ?", postIDs).Order("created_at ASC").Find(&comments)

	var agentReplies []models.PostAgentReply
	db.DB.Where("post_id IN ?", postIDs).Order("created_at ASC").Find(&agentReplies)

	commentUserIDs := make([]string, 0, len(comments))
	for _, cc := range comments {
		commentUserIDs = append(commentUserIDs, cc.UserID)
	}
	commentUserMap := buildUserMap(commentUserIDs)
	commentAvatarMap := buildUserDisplayAvatarMap(commentUserIDs)

	agentProfileIDs := make([]string, 0, len(agentReplies))
	for _, ar := range agentReplies {
		agentProfileIDs = append(agentProfileIDs, ar.ProfileID)
	}
	agentProfileMap := buildLifeAgentProfileMap(agentProfileIDs)

	byPost := make(map[string][]commentPreviewItem)
	for _, cc := range comments {
		cAuthor := "用户"
		cAvatar := ""
		if cu, ok := commentUserMap[cc.UserID]; ok {
			cAuthor = authorNameFromUser(cu)
		}
		cAvatar = commentAvatarMap[cc.UserID]
		byPost[cc.PostID] = append(byPost[cc.PostID], commentPreviewItem{
			createdAt: cc.CreatedAt,
			resp: commentResponse{
				ID:              cc.ID,
				Content:         cc.Content,
				AuthorName:      cAuthor,
				AuthorID:        cc.UserID,
				AuthorAvatarUrl: cAvatar,
				CreatedAt:       cc.CreatedAt.Format(time.RFC3339),
				IsAgentReply:    false,
			},
		})
	}
	for _, ar := range agentReplies {
		agentCoverUrl := ""
		if p, ok := agentProfileMap[ar.ProfileID]; ok {
			agentCoverUrl = lifeAgentCoverURL(&p)
		}
		byPost[ar.PostID] = append(byPost[ar.PostID], commentPreviewItem{
			createdAt: ar.CreatedAt,
			resp: commentResponse{
				ID:            ar.ID,
				Content:       ar.Content,
				AuthorName:    ar.DisplayName,
				AuthorID:      ar.ProfileID,
				CreatedAt:     ar.CreatedAt.Format(time.RFC3339),
				IsAgentReply:  true,
				AgentName:     ar.DisplayName,
				AgentID:       ar.ProfileID,
				AgentCoverUrl: agentCoverUrl,
			},
		})
	}

	for postID, items := range byPost {
		sort.Slice(items, func(i, j int) bool {
			return items[i].createdAt.Before(items[j].createdAt)
		})
		if len(items) > limit {
			items = items[:limit]
		}
		preview := make([]commentResponse, 0, len(items))
		for _, item := range items {
			preview = append(preview, item.resp)
		}
		out[postID] = preview
	}
	return out
}

// ---------- Handlers ----------

// PostsCreate 创建帖子（支持图片）
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
			ID:         models.GenID(),
			UserID:     user.ID,
			Content:    req.Content,
			Images:     req.Images,
			Visibility: models.NormalizePostVisibility(req.Visibility),
			Likes:      0,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		}
		if err := db.DB.Create(&post).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "CREATE_FAILED"})
			return
		}

		// 异步触发 Agent 自动回复（后台 goroutine，不阻塞响应）
		go triggerAgentReplies(post.ID, post.Content)

		c.JSON(http.StatusOK, gin.H{"id": post.ID})
	}
}

// PostsList 获取帖子列表（公开，支持 cursor 分页）
func PostsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		limitStr := c.Query("limit")
		limit := 20
		if n, err := strconv.Atoi(limitStr); err == nil && n > 0 && n <= 100 {
			limit = n
		}
		cursor := c.Query("cursor")
		// scope=mine 仅看自己的全部动态（含私密）；否则广场只展示公开动态。
		scope := c.Query("scope")
		currentUser := middleware.MustGetUser(c)

		var posts []models.Post
		q := db.DB.Order("created_at DESC").Limit(limit + 1)
		if cursor != "" {
			q = q.Where("created_at < ?", cursor)
		}
		if scope == "mine" {
			if currentUser == nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
				return
			}
			q = q.Where("user_id = ?", currentUser.ID)
		} else {
			// 广场：仅公开动态。为兼容历史无 visibility 的数据，把空串也视为公开。
			q = q.Where("visibility = ? OR visibility = '' OR visibility IS NULL", models.PostVisibilityPublic)
		}
		if err := q.Find(&posts).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "QUERY_FAILED"})
			return
		}

		nextCursor := ""
		hasMore := len(posts) > limit
		if hasMore {
			posts = posts[:limit]
			nextCursor = posts[len(posts)-1].CreatedAt.Format(time.RFC3339Nano)
		}

		// 批量查作者
		userIDs := make([]string, 0, len(posts))
		for _, p := range posts {
			userIDs = append(userIDs, p.UserID)
		}
		userMap := buildUserMap(userIDs)
		avatarMap := buildUserDisplayAvatarMap(userIDs)

		// 当前用户点赞状态
		likedMap := likedPostIDs("", []string{})
		if currentUser != nil {
			likedMap = likedPostIDs(currentUser.ID, postIDsFromPosts(posts))
		}

		previewMap := buildPreviewCommentsForPosts(postIDsFromPosts(posts), postPreviewCommentsLimit)

		resp := make([]postResponse, 0, len(posts))
		for _, p := range posts {
			u, ok := userMap[p.UserID]
			authorName := "用户"
			authorEmail := ""
			authorAvatarUrl := avatarMap[p.UserID]
			if ok {
				authorName = authorNameFromUser(u)
				authorEmail = u.Email
			}
			resp = append(resp, postResponse{
				ID:              p.ID,
				Content:         p.Content,
				Images:          p.Images,
				Visibility:      models.NormalizePostVisibility(p.Visibility),
				AuthorName:      authorName,
				AuthorEmail:     authorEmail,
				AuthorID:        p.UserID,
				AuthorAvatarUrl: authorAvatarUrl,
				CreatedAt:       p.CreatedAt.Format(time.RFC3339),
				UpdatedAt:       p.UpdatedAt.Format(time.RFC3339),
				Likes:           p.Likes,
				CommentsCount:   p.CommentsCount,
				LikedByMe:       likedMap[p.ID],
				PreviewComments: previewMap[p.ID],
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"items":      resp,
			"nextCursor": nextCursor,
			"hasMore":    hasMore,
		})
	}
}

// PostsGet 获取帖子详情
func PostsGet(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		postID := c.Param("id")
		var post models.Post
		if err := db.DB.First(&post, "id = ?", postID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}

		currentUser := middleware.MustGetUser(c)
		// 私密动态仅作者本人可见（其他用户视为不存在）
		if models.NormalizePostVisibility(post.Visibility) == models.PostVisibilityPrivate {
			if currentUser == nil || currentUser.ID != post.UserID {
				c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
				return
			}
		}

		var author models.User
		db.DB.First(&author, "id = ?", post.UserID)
		authorName := authorNameFromUser(author)

		likedByMe := false
		if currentUser != nil {
			var count int64
			db.DB.Model(&models.PostLike{}).Where("post_id = ? AND user_id = ?", post.ID, currentUser.ID).Count(&count)
			likedByMe = count > 0
		}

		// 普通评论
		var comments []models.PostComment
		db.DB.Where("post_id = ?", post.ID).Order("created_at ASC").Find(&comments)

		// Agent 回复
		var agentReplies []models.PostAgentReply
		db.DB.Where("post_id = ?", post.ID).Order("created_at ASC").Find(&agentReplies)

		// 收集评论者 IDs
		commentUserIDs := make([]string, 0, len(comments))
		for _, cc := range comments {
			commentUserIDs = append(commentUserIDs, cc.UserID)
		}
		commentUserMap := buildUserMap(commentUserIDs)
		commentAvatarMap := buildUserDisplayAvatarMap(append(commentUserIDs, post.UserID))

		commentResp := make([]commentResponse, 0, len(comments))
		for _, cc := range comments {
			cu, ok := commentUserMap[cc.UserID]
			cAuthor := "用户"
			if ok {
				cAuthor = authorNameFromUser(cu)
			}
			commentResp = append(commentResp, commentResponse{
				ID:              cc.ID,
				Content:         cc.Content,
				AuthorName:      cAuthor,
				AuthorID:        cc.UserID,
				AuthorAvatarUrl: commentAvatarMap[cc.UserID],
				CreatedAt:       cc.CreatedAt.Format(time.RFC3339),
				IsAgentReply:    false,
			})
		}

		agentProfileIDs := make([]string, 0, len(agentReplies))
		for _, ar := range agentReplies {
			agentProfileIDs = append(agentProfileIDs, ar.ProfileID)
		}
		agentProfileMap := buildLifeAgentProfileMap(agentProfileIDs)

		agentReplyResp := make([]commentResponse, 0, len(agentReplies))
		for _, ar := range agentReplies {
			agentCoverUrl := ""
			if p, ok := agentProfileMap[ar.ProfileID]; ok {
				agentCoverUrl = lifeAgentCoverURL(&p)
			}
			agentReplyResp = append(agentReplyResp, commentResponse{
				ID:            ar.ID,
				Content:       ar.Content,
				AuthorName:    ar.DisplayName,
				AuthorID:      ar.ProfileID,
				CreatedAt:     ar.CreatedAt.Format(time.RFC3339),
				IsAgentReply:  true,
				AgentName:     ar.DisplayName,
				AgentID:       ar.ProfileID,
				AgentCoverUrl: agentCoverUrl,
			})
		}

		c.JSON(http.StatusOK, postDetailResponse{
			ID:              post.ID,
			Content:         post.Content,
			Images:          post.Images,
			Visibility:      models.NormalizePostVisibility(post.Visibility),
			AuthorName:      authorName,
			AuthorEmail:     author.Email,
			AuthorID:        post.UserID,
			AuthorAvatarUrl: commentAvatarMap[post.UserID],
			CreatedAt:       post.CreatedAt.Format(time.RFC3339),
			UpdatedAt:       post.UpdatedAt.Format(time.RFC3339),
			Likes:           post.Likes,
			CommentsCount:   post.CommentsCount,
			LikedByMe:       likedByMe,
			Comments:        commentResp,
			AgentReplies:    agentReplyResp,
		})
	}
}

// PostsUpdate 修改自己的帖子
func PostsUpdate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		postID := c.Param("id")
		var post models.Post
		if err := db.DB.First(&post, "id = ?", postID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if post.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}

		// 只允许修改 30 分钟内的帖子
		if time.Since(post.CreatedAt) > 30*time.Minute {
			c.JSON(http.StatusForbidden, gin.H{"error": "EDIT_WINDOW_EXPIRED", "message": "帖子发布超过 30 分钟，无法修改"})
			return
		}

		var req postUpdateReq
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
			return
		}

		post.Content = req.Content
		post.Images = req.Images
		if req.Visibility != nil {
			post.Visibility = models.NormalizePostVisibility(*req.Visibility)
		}
		post.UpdatedAt = time.Now()
		if err := db.DB.Save(&post).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "UPDATE_FAILED"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// PostsDelete 删除自己的帖子
func PostsDelete(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		postID := c.Param("id")
		var post models.Post
		if err := db.DB.First(&post, "id = ?", postID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		if post.UserID != user.ID {
			c.JSON(http.StatusForbidden, gin.H{"error": "FORBIDDEN"})
			return
		}

		// 事务删除帖子及其关联数据
		err := db.DB.Transaction(func(tx *gorm.DB) error {
			if err := tx.Delete(&models.PostLike{}, "post_id = ?", postID).Error; err != nil {
				return err
			}
			if err := tx.Delete(&models.PostComment{}, "post_id = ?", postID).Error; err != nil {
				return err
			}
			if err := tx.Delete(&models.PostAgentReply{}, "post_id = ?", postID).Error; err != nil {
				return err
			}
			if err := tx.Delete(&post).Error; err != nil {
				return err
			}
			return nil
		})
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "DELETE_FAILED"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"ok": true})
	}
}

// PostsLikeToggle 点赞 / 取消赞
func PostsLikeToggle(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		postID := c.Param("id")
		var post models.Post
		if err := db.DB.First(&post, "id = ?", postID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		// 私密动态仅作者本人可操作
		if models.NormalizePostVisibility(post.Visibility) == models.PostVisibilityPrivate && post.UserID != user.ID {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}

		var existing models.PostLike
		err := db.DB.Where("post_id = ? AND user_id = ?", postID, user.ID).First(&existing).Error
		if err != nil {
			// 未点赞 → 点赞
			like := models.PostLike{
				ID:        models.GenID(),
				PostID:    postID,
				UserID:    user.ID,
				CreatedAt: time.Now(),
			}
			if err := db.DB.Create(&like).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "LIKE_FAILED"})
				return
			}
			// 原子 +1
			db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("likes", gorm.Expr("likes + 1"))
			c.JSON(http.StatusOK, gin.H{"liked": true, "likes": post.Likes + 1})
			return
		}

		// 已点赞 → 取消
		if err := db.DB.Delete(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "UNLIKE_FAILED"})
			return
		}
		// 原子 -1（保底 0）
		db.DB.Model(&models.Post{}).Where("id = ? AND likes > 0", postID).UpdateColumn("likes", gorm.Expr("likes - 1"))
		newLikes := post.Likes - 1
		if newLikes < 0 {
			newLikes = 0
		}
		c.JSON(http.StatusOK, gin.H{"liked": false, "likes": newLikes})
	}
}

// PostsCommentCreate 发表评论
func PostsCommentCreate(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		user := middleware.MustGetUser(c)
		if user == nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "UNAUTHORIZED"})
			return
		}

		postID := c.Param("id")
		var post models.Post
		if err := db.DB.First(&post, "id = ?", postID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		// 私密动态仅作者本人可评论（其他用户不可见）
		if models.NormalizePostVisibility(post.Visibility) == models.PostVisibilityPrivate && post.UserID != user.ID {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}

		var req struct {
			Content        string  `json:"content" binding:"required,min=1,max=2000"`
			ReplyToAgentID *string `json:"reply_to_agent_id"` // 回复的Agent ID
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
			return
		}

		comment := models.PostComment{
			ID:             models.GenID(),
			PostID:         postID,
			UserID:         user.ID,
			ReplyToAgentID: req.ReplyToAgentID,
			Content:        req.Content,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}
		if err := db.DB.Create(&comment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "CREATE_FAILED"})
			return
		}

		// 更新评论计数
		db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("comments_count", gorm.Expr("comments_count + 1"))

		// 如果回复了Agent，触发Agent回复
		if req.ReplyToAgentID != nil && *req.ReplyToAgentID != "" {
			go triggerAgentReplyToComment(postID, *req.ReplyToAgentID, user.ID, req.Content)
		}

		c.JSON(http.StatusOK, gin.H{"id": comment.ID})
	}
}

// PostsCommentsList 获取帖子的评论列表
func PostsCommentsList(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		postID := c.Param("id")
		var post models.Post
		if err := db.DB.First(&post, "id = ?", postID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
			return
		}
		// 私密动态评论仅作者本人可见
		if models.NormalizePostVisibility(post.Visibility) == models.PostVisibilityPrivate {
			cu := middleware.MustGetUser(c)
			if cu == nil || cu.ID != post.UserID {
				c.JSON(http.StatusNotFound, gin.H{"error": "NOT_FOUND"})
				return
			}
		}

		var comments []models.PostComment
		db.DB.Where("post_id = ?", postID).Order("created_at ASC").Find(&comments)

		userIDs := make([]string, 0, len(comments))
		for _, cc := range comments {
			userIDs = append(userIDs, cc.UserID)
		}
		userMap := buildUserMap(userIDs)
		avatarMap := buildUserDisplayAvatarMap(userIDs)

		resp := make([]commentResponse, 0, len(comments))
		for _, cc := range comments {
			cu, ok := userMap[cc.UserID]
			cAuthor := "用户"
			if ok {
				cAuthor = authorNameFromUser(cu)
			}
			resp = append(resp, commentResponse{
				ID:              cc.ID,
				Content:         cc.Content,
				AuthorName:      cAuthor,
				AuthorID:        cc.UserID,
				AuthorAvatarUrl: avatarMap[cc.UserID],
				CreatedAt:       cc.CreatedAt.Format(time.RFC3339),
			})
		}

		c.JSON(http.StatusOK, gin.H{"items": resp})
	}
}

// ---------- Agent 自动回复 ----------

// triggerAgentReplyToComment 用户回复Agent评论后，触发Agent回复
func triggerAgentReplyToComment(postID, profileID, userID, userComment string) {
	var cfg *config.Config
	if config := config.Load(); config != nil {
		cfg = config
	}

	var profile models.LifeAgentProfile
	if err := db.DB.Where("id = ? AND published = ?", profileID, true).First(&profile).Error; err != nil {
		log.Printf("[AgentReplyToComment] Agent not found: %v", err)
		return
	}

	// 获取或创建对话计数
	var count models.PostAgentConversationCount
	now := time.Now()
	if err := db.DB.Where("user_id = ? AND profile_id = ?", userID, profileID).First(&count).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// 创建新记录
			count = models.PostAgentConversationCount{
				ID:         models.GenID(),
				UserID:     userID,
				ProfileID:  profileID,
				ReplyCount: 0,
				CreatedAt:  now,
				UpdatedAt:  now,
			}
		} else {
			log.Printf("[AgentReplyToComment] Failed to query conversation count: %v", err)
			return
		}
	}

	// 增加回复次数
	count.ReplyCount++
	count.LastReplyAt = &now
	count.UpdatedAt = now
	db.DB.Save(&count)

	// 如果是第三次回复，引导私聊
	if count.ReplyCount >= 3 {
		replyText := "我们已经聊了很多了，建议你直接找我私聊，我可以更详细地帮你。点击我的头像开始对话吧。"
		ar := models.PostAgentReply{
			ID:          models.GenID(),
			PostID:      postID,
			ProfileID:   profile.ID,
			Content:     replyText,
			DisplayName: profile.DisplayName,
			CreatedAt:   time.Now().Add(time.Duration(5) * time.Second),
		}
		_ = db.DB.Create(&ar).Error
		db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("comments_count", gorm.Expr("comments_count + 1"))
		log.Printf("[AgentReplyToComment] Guided to private chat for user %s with agent %s", userID, profile.DisplayName)
		return
	}

	// 生成回复
	commentCtx := lifeagent.PostReplyContext{
		PostContent:     userComment,
		ExistingReplies: loadPostAgentReplyTexts(postID),
		Tier:            lifeagent.ClassifyPostReplyTier(userComment),
	}
	replyText := generateAgentReply(cfg, profile, commentCtx)
	if replyText == "" {
		return
	}

	ar := models.PostAgentReply{
		ID:          models.GenID(),
		PostID:      postID,
		ProfileID:   profile.ID,
		Content:     replyText,
		DisplayName: profile.DisplayName,
		CreatedAt:   time.Now().Add(time.Duration(5+len(replyText)%30) * time.Second),
	}
	_ = db.DB.Create(&ar).Error
	db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("comments_count", gorm.Expr("comments_count + 1"))
	log.Printf("[AgentReplyToComment] Agent %s replied to user %s, reply count: %d", profile.DisplayName, userID, count.ReplyCount)
}

// triggerAgentReplies 根据帖子内容与 Agent ExpertiseTags 的匹配度选取相关 Agent 生成自动回复
func triggerAgentReplies(postID string, content string) {
	go func() {
		_, _ = TriggerAgentRepliesSync(postID, content)
	}()
}

// TriggerAgentRepliesSync 同步生成 Agent 自动回复，返回成功写入的回复数。
func TriggerAgentRepliesSync(postID string, content string) (int, error) {
	cfg := config.Load()
	var profiles []models.LifeAgentProfile
	if err := db.DB.Where("published = ?", true).Find(&profiles).Error; err != nil {
		return 0, err
	}
	if len(profiles) == 0 {
		return 0, nil
	}

	tier := lifeagent.ClassifyPostReplyTier(content)
	replyCtx := lifeagent.PostReplyContext{
		PostContent: content,
		Tier:        tier,
	}

	selected := selectAgentsForPostReply(profiles, content, tier)
	if len(selected) == 0 {
		log.Printf("[AgentReply] Post %s no agents to reply", postID)
		return 0, nil
	}

	created := 0
	for _, p := range selected {
		replyText := generateAgentReply(cfg, p, replyCtx)
		if replyText == "" {
			continue
		}
		ar := models.PostAgentReply{
			ID:          models.GenID(),
			PostID:      postID,
			ProfileID:   p.ID,
			Content:     replyText,
			DisplayName: p.DisplayName,
			CreatedAt:   time.Now().Add(time.Duration(5+len(replyText)%30) * time.Second),
		}
		if err := db.DB.Create(&ar).Error; err != nil {
			return created, err
		}
		replyCtx.ExistingReplies = append(replyCtx.ExistingReplies, replyText)
		db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("comments_count", gorm.Expr("comments_count + 1"))
		created++
	}
	return created, nil
}

func selectAgentsForPostReply(profiles []models.LifeAgentProfile, content string, tier lifeagent.PostReplyTier) []models.LifeAgentProfile {
	type scored struct {
		profile models.LifeAgentProfile
		score   int
	}
	var scoredList []scored
	for _, p := range profiles {
		pForAI := lifeagent.ProfileForAI{
			ExpertiseTags: p.ExpertiseTags,
			Headline:      p.Headline,
			ShortBio:      p.ShortBio,
			Audience:      p.Audience,
		}
		score := lifeagent.ScoreAgentPostRelevance(content, pForAI)
		if score >= lifeagent.PostReplyMinAgentScore {
			scoredList = append(scoredList, scored{p, score})
		}
	}
	sort.Slice(scoredList, func(i, j int) bool {
		return scoredList[i].score > scoredList[j].score
	})

	maxReplies := lifeagent.PostReplyMaxAgents
	if tier == lifeagent.PostReplyTierBrief {
		maxReplies = lifeagent.PostReplyBriefMaxAgents
	}
	if len(scoredList) > 0 {
		if len(scoredList) < maxReplies {
			maxReplies = len(scoredList)
		}
		out := make([]models.LifeAgentProfile, 0, maxReplies)
		for i := 0; i < maxReplies; i++ {
			out = append(out, scoredList[i].profile)
		}
		return out
	}

	// 常规帖无相关 Agent 则不回复
	if tier != lifeagent.PostReplyTierBrief {
		return nil
	}

	// 短帖调侃场景：随机选几个 Agent，不要求相关性
	if len(profiles) <= maxReplies {
		return profiles
	}
	// Fisher-Yates 随机取前 maxReplies 个
	out := make([]models.LifeAgentProfile, len(profiles))
	copy(out, profiles)
	for i := len(out) - 1; i > 0; i-- {
		j := globalRand.Intn(i + 1)
		out[i], out[j] = out[j], out[i]
	}
	return out[:maxReplies]
}


func loadPostAgentReplyTexts(postID string) []string {
	var replies []models.PostAgentReply
	db.DB.Where("post_id = ?", postID).Order("created_at ASC").Find(&replies)
	out := make([]string, 0, len(replies))
	for _, r := range replies {
		if text := strings.TrimSpace(r.Content); text != "" {
			out = append(out, text)
		}
	}
	return out
}

func generateAgentReply(cfg *config.Config, profile models.LifeAgentProfile, replyCtx lifeagent.PostReplyContext) string {
	log.Printf("[AgentReply] Generating reply for agent %s, post: %s", profile.DisplayName, replyCtx.PostContent)

	if cfg == nil || cfg.OpenAIApiKey == "" {
		log.Printf("[AgentReply] LLM not configured, skipping reply for agent %s", profile.DisplayName)
		return ""
	}

	log.Printf("[AgentReply] LLM configured, model=%s, baseURL=%s", cfg.OpenAIModel, cfg.OpenAIBaseURL)

	// 转换为ProfileForAI
	profileForAI := lifeagent.ProfileForAI{
		DisplayName:      profile.DisplayName,
		Headline:         profile.Headline,
		ShortBio:         profile.ShortBio,
		LongBio:          profile.LongBio,
		Audience:         profile.Audience,
		WelcomeMessage:   profile.WelcomeMessage,
		ExpertiseTags:    profile.ExpertiseTags,
		MBTI:             safeStringPtr(profile.MBTI),
		PersonaArchetype: safeStringPtr(profile.PersonaArchetype),
		ToneStyle:        safeStringPtr(profile.ToneStyle),
		ResponseStyle:    safeStringPtr(profile.ResponseStyle),
		ForbiddenPhrases: profile.ForbiddenPhrases,
		ExampleReplies:   profile.ExampleReplies,
		NotSuitableFor:   safeStringPtr(profile.NotSuitableFor),
	}
	profileForAI = lifeagent.EnrichProfileForAI(profile.ID, profileForAI)

	// 加载知识库信息
	var entries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id = ?", profile.ID).Order("sort_order").Find(&entries)

	var facts []models.LifeAgentStructuredFact
	db.DB.Where("profile_id = ?", profile.ID).Find(&facts)

	var topics []models.LifeAgentTopicSummary
	db.DB.Where("profile_id = ?", profile.ID).Find(&topics)

	log.Printf("[AgentReply] Loaded knowledge: %d entries, %d facts, %d topics", len(entries), len(facts), len(topics))

	if len(entries) == 0 && len(facts) == 0 && len(topics) == 0 {
		log.Printf("[AgentReply] No knowledge for agent %s, skipping reply", profile.DisplayName)
		return ""
	}

	// 转换为AI格式
	entriesForAI := make([]lifeagent.KnowledgeEntryForAI, len(entries))
	for i, e := range entries {
		entriesForAI[i] = lifeagent.KnowledgeEntryForAI{
			ID:       e.ID,
			Category: e.Category,
			Title:    e.Title,
			Content:  e.Content,
			Tags:     []string(e.Tags),
		}
	}

	factsForAI := lifeagent.BuildStructuredFactsForAI(facts)
	topicsForAI := lifeagent.BuildTopicSummariesForAI(topics)

	// 调用LLM生成回复，使用更长的超时时间
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	message := lifeagent.BuildPostReplyMessage(replyCtx)
	opts := &lifeagent.ChatOptions{
		WorkingState: &lifeagent.WorkingState{
			Strategy: lifeagent.Strategy{
				PromptLengthHint: lifeagent.PostReplyLengthHint(replyCtx.Tier),
				FormatRules:      lifeagent.PostReplyFormatRules(replyCtx),
			},
		},
	}

	content, _, err := lifeagent.BuildReplyWithLLM(
		ctx,
		cfg.OpenAIApiKey,
		cfg.OpenAIModel,
		cfg.OpenAIBaseURL,
		cfg.LLMEnableWebSearch,
		profileForAI,
		factsForAI,
		topicsForAI,
		entriesForAI,
		[]lifeagent.ChatMessageForAI{}, // 无历史对话
		message,
		opts,
	)

	if err != nil || content == "" || content == "大模型出错了哦" {
		log.Printf("[AgentReply] LLM call failed: err=%v, content=%s, skipping reply", err, content)
		return ""
	}

	log.Printf("[AgentReply] LLM generated reply: %s", content)

	if lifeagent.IsPostReplySkipped(content) {
		log.Printf("[AgentReply] Agent %s skipped reply", profile.DisplayName)
		return ""
	}
	// 用句子边界截断，不硬截，保证输出是完整的句子
	content = lifeagent.TrimPostReply(replyCtx, content)
	log.Printf("[AgentReply] Final reply: %s", content)
	return content
}

func safeStringPtr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
