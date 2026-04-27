package handler

import (
	"context"
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

// ---------- Request / Response types ----------

type postCreateReq struct {
	Content string   `json:"content" binding:"required,min=1,max=2000"`
	Images  []string `json:"images"`
}

type postUpdateReq struct {
	Content string   `json:"content" binding:"required,min=1,max=2000"`
	Images  []string `json:"images"`
}

type postResponse struct {
	ID            string   `json:"id"`
	Content       string   `json:"content"`
	Images        []string `json:"images"`
	AuthorName    string   `json:"authorName"`
	AuthorEmail   string   `json:"authorEmail"`
	AuthorID      string   `json:"authorId"`
	CreatedAt     string   `json:"createdAt"`
	UpdatedAt     string   `json:"updatedAt"`
	Likes         int      `json:"likes"`
	CommentsCount int      `json:"commentsCount"`
	LikedByMe     bool     `json:"likedByMe"`
}

type commentResponse struct {
	ID           string `json:"id"`
	Content      string `json:"content"`
	AuthorName   string `json:"authorName"`
	AuthorID     string `json:"authorId"`
	CreatedAt    string `json:"createdAt"`
	IsAgentReply bool   `json:"isAgentReply"`
	AgentName    string `json:"agentName,omitempty"`
}

type postDetailResponse struct {
	ID            string            `json:"id"`
	Content       string            `json:"content"`
	Images        []string          `json:"images"`
	AuthorName    string            `json:"authorName"`
	AuthorEmail   string            `json:"authorEmail"`
	AuthorID      string            `json:"authorId"`
	CreatedAt     string            `json:"createdAt"`
	UpdatedAt     string            `json:"updatedAt"`
	Likes         int               `json:"likes"`
	CommentsCount int               `json:"commentsCount"`
	LikedByMe     bool              `json:"likedByMe"`
	Comments      []commentResponse `json:"comments"`
	AgentReplies  []commentResponse `json:"agentReplies"`
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
			ID:        models.GenID(),
			UserID:    user.ID,
			Content:   req.Content,
			Images:    req.Images,
			Likes:     0,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
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

		var posts []models.Post
		q := db.DB.Order("created_at DESC").Limit(limit + 1)
		if cursor != "" {
			q = q.Where("created_at < ?", cursor)
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

		// 当前用户点赞状态
		currentUser := middleware.MustGetUser(c)
		likedMap := likedPostIDs("", []string{})
		if currentUser != nil {
			likedMap = likedPostIDs(currentUser.ID, postIDsFromPosts(posts))
		}

		resp := make([]postResponse, 0, len(posts))
		for _, p := range posts {
			u, ok := userMap[p.UserID]
			authorName := "用户"
			authorEmail := ""
			if ok {
				authorName = authorNameFromUser(u)
				authorEmail = u.Email
			}
			resp = append(resp, postResponse{
				ID:            p.ID,
				Content:       p.Content,
				Images:        p.Images,
				AuthorName:    authorName,
				AuthorEmail:   authorEmail,
				AuthorID:      p.UserID,
				CreatedAt:     p.CreatedAt.Format(time.RFC3339),
				UpdatedAt:     p.UpdatedAt.Format(time.RFC3339),
				Likes:         p.Likes,
				CommentsCount: p.CommentsCount,
				LikedByMe:     likedMap[p.ID],
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

		var author models.User
		db.DB.First(&author, "id = ?", post.UserID)
		authorName := authorNameFromUser(author)

		currentUser := middleware.MustGetUser(c)
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

		commentResp := make([]commentResponse, 0, len(comments))
		for _, cc := range comments {
			cu, ok := commentUserMap[cc.UserID]
			cAuthor := "用户"
			if ok {
				cAuthor = authorNameFromUser(cu)
			}
			commentResp = append(commentResp, commentResponse{
				ID:           cc.ID,
				Content:      cc.Content,
				AuthorName:   cAuthor,
				AuthorID:     cc.UserID,
				CreatedAt:    cc.CreatedAt.Format(time.RFC3339),
				IsAgentReply: false,
			})
		}

		agentReplyResp := make([]commentResponse, 0, len(agentReplies))
		for _, ar := range agentReplies {
			agentReplyResp = append(agentReplyResp, commentResponse{
				ID:           ar.ID,
				Content:      ar.Content,
				AuthorName:   ar.DisplayName,
				AuthorID:     "",
				CreatedAt:    ar.CreatedAt.Format(time.RFC3339),
				IsAgentReply: true,
				AgentName:    ar.DisplayName,
			})
		}

		c.JSON(http.StatusOK, postDetailResponse{
			ID:            post.ID,
			Content:       post.Content,
			Images:        post.Images,
			AuthorName:    authorName,
			AuthorEmail:   author.Email,
			AuthorID:      post.UserID,
			CreatedAt:     post.CreatedAt.Format(time.RFC3339),
			UpdatedAt:     post.UpdatedAt.Format(time.RFC3339),
			Likes:         post.Likes,
			CommentsCount: post.CommentsCount,
			LikedByMe:     likedByMe,
			Comments:      commentResp,
			AgentReplies:  agentReplyResp,
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

		var req struct {
			Content string `json:"content" binding:"required,min=1,max=2000"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_INPUT", "message": err.Error()})
			return
		}

		comment := models.PostComment{
			ID:        models.GenID(),
			PostID:    postID,
			UserID:    user.ID,
			Content:   req.Content,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}
		if err := db.DB.Create(&comment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "CREATE_FAILED"})
			return
		}

		// 更新评论计数
		db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("comments_count", gorm.Expr("comments_count + 1"))

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

		var comments []models.PostComment
		db.DB.Where("post_id = ?", postID).Order("created_at ASC").Find(&comments)

		userIDs := make([]string, 0, len(comments))
		for _, cc := range comments {
			userIDs = append(userIDs, cc.UserID)
		}
		userMap := buildUserMap(userIDs)

		resp := make([]commentResponse, 0, len(comments))
		for _, cc := range comments {
			cu, ok := userMap[cc.UserID]
			cAuthor := "用户"
			if ok {
				cAuthor = authorNameFromUser(cu)
			}
			resp = append(resp, commentResponse{
				ID:         cc.ID,
				Content:    cc.Content,
				AuthorName: cAuthor,
				AuthorID:   cc.UserID,
				CreatedAt:  cc.CreatedAt.Format(time.RFC3339),
			})
		}

		c.JSON(http.StatusOK, gin.H{"items": resp})
	}
}

// ---------- Agent 自动回复 ----------

// triggerAgentReplies 根据帖子内容与 Agent ExpertiseTags 的匹配度选取相关 Agent 生成自动回复
func triggerAgentReplies(postID string, content string) {
	var cfg *config.Config
	if config := config.Load(); config != nil {
		cfg = config
	}
	var profiles []models.LifeAgentProfile
	if err := db.DB.Where("published = ?", true).Find(&profiles).Error; err != nil {
		return
	}
	if len(profiles) == 0 {
		return
	}

	// 关键词匹配：帖子内容 vs Agent ExpertiseTags
	lowerContent := strings.ToLower(content)
	type scored struct {
		profile models.LifeAgentProfile
		score   int
	}
	var scoredList []scored
	for _, p := range profiles {
		score := 0
		for _, tag := range p.ExpertiseTags {
			if strings.Contains(lowerContent, strings.ToLower(tag)) {
				score++
			}
		}
		if score > 0 {
			scoredList = append(scoredList, scored{p, score})
		}
	}

	// 按匹配度降序
	sort.Slice(scoredList, func(i, j int) bool {
		return scoredList[i].score > scoredList[j].score
	})

	// 随机取 3-11 个匹配的
	maxReplies := 3 + rand.Intn(9) // 3-11
	var selected []models.LifeAgentProfile
	for i := 0; i < len(scoredList) && i < maxReplies; i++ {
		selected = append(selected, scoredList[i].profile)
	}

	// Fallback：无匹配时随机选 3-11 个
	if len(selected) == 0 {
		if err := db.DB.Where("published = ?", true).Order("RAND()").Limit(maxReplies).Find(&selected).Error; err != nil {
			return
		}
		if len(selected) == 0 {
			return
		}
	}

	for _, p := range selected {
		replyText := generateAgentReply(cfg, p, content)
		ar := models.PostAgentReply{
			ID:          models.GenID(),
			PostID:      postID,
			ProfileID:   p.ID,
			Content:     replyText,
			DisplayName: p.DisplayName,
			CreatedAt:   time.Now().Add(time.Duration(5+len(replyText)%30) * time.Second), // stagger 避免同时出现
		}
		_ = db.DB.Create(&ar).Error

		// 更新帖子评论计数（Agent 回复也计入）
		db.DB.Model(&models.Post{}).Where("id = ?", postID).UpdateColumn("comments_count", gorm.Expr("comments_count + 1"))
	}
}

func generateAgentReply(cfg *config.Config, profile models.LifeAgentProfile, postContent string) string {
	// 如果没有配置LLM，使用简单模板
	if cfg == nil || cfg.OpenAIApiKey == "" {
		return generateSimpleReply(profile.DisplayName, postContent)
	}

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

	// 加载知识库信息
	var entries []models.LifeAgentKnowledgeEntry
	db.DB.Where("profile_id = ?", profile.ID).Order("sort_order").Find(&entries)

	var facts []models.LifeAgentStructuredFact
	db.DB.Where("profile_id = ?", profile.ID).Find(&facts)

	var topics []models.LifeAgentTopicSummary
	db.DB.Where("profile_id = ?", profile.ID).Find(&topics)

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

	// 调用LLM生成回复
	ctx := context.Background()
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
		postContent,
		nil, // ChatOptions - 动态回复不需要特殊选项
	)

	if err != nil || content == "" {
		// LLM调用失败，回退到简单模板
		return generateSimpleReply(profile.DisplayName, postContent)
	}

	// 确保不超过50字
	runes := []rune(content)
	if len(runes) > 50 {
		content = string(runes[:50])
	}

	return content
}

func generateSimpleReply(agentName string, content string) string {
	// 极简单的回复模板，LLM不可用时的回退
	if len(content) > 50 {
		return agentName + " 看到了你的分享，想和你深入聊聊这个话题。点击上方头像可以开始对话。"
	}
	return agentName + " 很感兴趣，想听听更多细节。"
}

func safeStringPtr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
