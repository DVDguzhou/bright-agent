package router

import (
	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/handler"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func Setup(cfg *config.Config) *gin.Engine {
	r := gin.Default()
	r.Use(middleware.CORS(cfg))

	api := r.Group("/api")
	{
		api.GET("/sse-test", handler.SSETest())
		auth := api.Group("/auth")
		{
			auth.POST("/login", handler.Login(cfg))
			auth.POST("/signup", handler.Signup(cfg))
			auth.POST("/logout", handler.Logout(cfg))
			auth.POST("/forgot-password", handler.ForgotPassword(cfg))
			auth.POST("/reset-password", handler.ResetPassword(cfg))
			auth.POST("/change-password", middleware.RequireAuth(cfg), handler.ChangePassword(cfg))
			auth.GET("/me", middleware.RequireAuth(cfg), handler.Me(cfg))
			auth.GET("/wechat/redirect", handler.WeChatRedirect(cfg))
			auth.GET("/wechat/callback", handler.WeChatCallback(cfg))
			auth.POST("/phone/send-code", handler.PhoneSendCode(cfg))
			auth.POST("/phone/verify", handler.PhoneVerify(cfg))
			auth.POST("/email/send-code", handler.EmailSendCode(cfg))
			auth.POST("/email/verify", handler.EmailVerify(cfg))
		}

		agents := api.Group("/agents")
		{
			agents.GET("", middleware.Auth(cfg), handler.AgentsList(cfg))
			agents.POST("", middleware.RequireAuth(cfg), handler.AgentsCreate(cfg))
			agents.GET("/:id", handler.AgentsGet(cfg))
			agents.PATCH("/:id", middleware.RequireAuth(cfg), handler.AgentsUpdate(cfg))
			agents.DELETE("/:id", middleware.RequireAuth(cfg), handler.AgentsDelete(cfg))
		}

		licenses := api.Group("/licenses")
		{
			licenses.GET("", middleware.RequireAuth(cfg), handler.LicensesList(cfg))
			licenses.POST("", middleware.RequireAuth(cfg), handler.LicensesCreate(cfg))
		}

		lifeAgents := api.Group("/life-agents")
		{
			lifeAgents.GET("", handler.LifeAgentsList(cfg))
			lifeAgents.GET("/search", handler.LifeAgentsSearch(cfg))
			lifeAgents.POST("", middleware.RequireAuth(cfg), handler.LifeAgentsCreate(cfg))
			lifeAgents.GET("/favorites", middleware.RequireAuth(cfg), handler.LifeAgentFavoritesList(cfg))
			lifeAgents.POST("/favorites", middleware.RequireAuth(cfg), handler.LifeAgentFavoritesToggle(cfg))
			lifeAgents.PUT("/favorites", middleware.RequireAuth(cfg), handler.LifeAgentFavoritesImport(cfg))
			lifeAgents.POST("/create/next-question", middleware.RequireAuth(cfg), handler.LifeAgentsCreateNextQuestion(cfg))
			lifeAgents.POST("/create/profile-summary", middleware.RequireAuth(cfg), handler.LifeAgentsCreateProfileSummary(cfg))
			lifeAgents.GET("/chat-sessions", middleware.RequireAuth(cfg), handler.LifeAgentsBuyerChatSessions(cfg))
			lifeAgents.GET("/mine", middleware.RequireAuth(cfg), handler.LifeAgentsMine(cfg))
			lifeAgents.GET("/mine/api-overview", middleware.RequireAuth(cfg), handler.LifeAgentsMineAPIOverview(cfg))
			lifeAgents.GET("/purchased", middleware.RequireAuth(cfg), handler.LifeAgentsPurchased(cfg))
			lifeAgents.GET("/feedback/all", middleware.RequireAuth(cfg), handler.LifeAgentsFeedbackAll(cfg))
			lifeAgents.GET("/map-pins", handler.LifeAgentsMapPins())
			lifeAgents.GET("/:id", middleware.Auth(cfg), handler.LifeAgentsGet(cfg))
			lifeAgents.PATCH("/:id", middleware.RequireAuth(cfg), handler.LifeAgentsUpdate(cfg))
			lifeAgents.DELETE("/:id", middleware.RequireAuth(cfg), handler.LifeAgentsDelete(cfg))
			lifeAgents.GET("/:id/manage", middleware.RequireAuth(cfg), handler.LifeAgentsManage(cfg))
			lifeAgents.GET("/:id/topics", middleware.RequireAuth(cfg), handler.LifeAgentsTopicsList(cfg))
			lifeAgents.PATCH("/:id/topics/:topicId", middleware.RequireAuth(cfg), handler.LifeAgentsTopicUpdate(cfg))
			lifeAgents.POST("/:id/topics/merge", middleware.RequireAuth(cfg), handler.LifeAgentsTopicsMerge(cfg))
			lifeAgents.GET("/:id/invoke-keys", middleware.RequireAuth(cfg), handler.LifeAgentsInvokeKeysList(cfg))
			lifeAgents.POST("/:id/invoke-keys", middleware.RequireAuth(cfg), handler.LifeAgentsInvokeKeysCreate(cfg))
			lifeAgents.DELETE("/:id/invoke-keys/:keyId", middleware.RequireAuth(cfg), handler.LifeAgentsInvokeKeysDelete(cfg))
			lifeAgents.POST("/:id/api/chat", handler.LifeAgentsChatAPI(cfg))
			lifeAgents.POST("/:id/modify-via-chat", middleware.RequireAuth(cfg), handler.LifeAgentsModifyViaChat(cfg))
			lifeAgents.POST("/:id/parse-chat", middleware.RequireAuth(cfg), handler.LifeAgentsParseChatPreview(cfg))
			lifeAgents.POST("/:id/import-chat", middleware.RequireAuth(cfg), handler.LifeAgentsImportChat(cfg))
			lifeAgents.POST("/:id/purchase", middleware.RequireAuth(cfg), handler.LifeAgentsPurchase(cfg))
			lifeAgents.GET("/:id/chat/sessions", middleware.RequireAuth(cfg), handler.LifeAgentsChatSessions(cfg))
			lifeAgents.GET("/:id/chat/sessions/:sessionId", middleware.RequireAuth(cfg), handler.LifeAgentsChatSessionDetail(cfg))
			lifeAgents.POST("/:id/chat", middleware.RequireAuth(cfg), handler.LifeAgentsChat(cfg))
			lifeAgents.POST("/:id/chat/feedback", middleware.RequireAuth(cfg), handler.LifeAgentsChatFeedback(cfg))
			lifeAgents.POST("/:id/rating", middleware.RequireAuth(cfg), handler.LifeAgentsRate(cfg))
			lifeAgents.GET("/:id/feedback-summary", middleware.RequireAuth(cfg), handler.LifeAgentsFeedbackSummary(cfg))
			lifeAgents.GET("/:id/blind-spots", middleware.RequireAuth(cfg), handler.LifeAgentsBlindSpots(cfg))
			lifeAgents.POST("/:id/blind-spots/:spotId/resolve", middleware.RequireAuth(cfg), handler.LifeAgentsBlindSpotResolve(cfg))
			lifeAgents.GET("/:id/follow-up-questions", middleware.RequireAuth(cfg), handler.LifeAgentsFollowUpQuestions(cfg))
			lifeAgents.GET("/:id/live-updates", handler.LifeAgentsLiveUpdatesList(cfg))
			lifeAgents.POST("/:id/live-updates", middleware.RequireAuth(cfg), handler.LifeAgentsLiveUpdateCreate(cfg))
			lifeAgents.DELETE("/:id/live-updates/:updateId", middleware.RequireAuth(cfg), handler.LifeAgentsLiveUpdateDelete(cfg))
		}

		payWx := api.Group("/pay/wechat")
		{
			payWx.GET("/native/enabled", handler.WeChatPayNativeEnabled(cfg))
			payWx.POST("/notify", handler.WeChatPayNotify(cfg))
			payWx.GET("/orders/:outTradeNo", middleware.RequireAuth(cfg), handler.WeChatPayOrderQuery(cfg))
			payWx.POST("/native/life-agent/:id", middleware.RequireAuth(cfg), handler.WeChatPayNativeLifeAgentPrepay(cfg))
		}

		api.GET("/user-api-keys", middleware.RequireAuth(cfg), handler.UserAPIKeysList(cfg))
		api.POST("/user-api-keys", middleware.RequireAuth(cfg), handler.UserAPIKeysCreate(cfg))
		api.DELETE("/user-api-keys/:id", middleware.RequireAuth(cfg), handler.UserAPIKeysDelete(cfg))

		api.POST("/invocations/issue-token", middleware.RequireAuth(cfg), handler.InvocationsIssueToken(cfg))
		api.POST("/upload/life-agent-cover", middleware.RequireAuth(cfg), handler.LifeAgentCoverUpload(cfg))
		api.GET("/upload/life-agent-cover/:name", handler.LifeAgentCoverGet(cfg))

		posts := api.Group("/posts")
		{
			posts.GET("", handler.PostsList(cfg))
			posts.POST("", middleware.RequireAuth(cfg), handler.PostsCreate(cfg))
			posts.GET("/:id", handler.PostsGet(cfg))
			posts.PATCH("/:id", middleware.RequireAuth(cfg), handler.PostsUpdate(cfg))
			posts.DELETE("/:id", middleware.RequireAuth(cfg), handler.PostsDelete(cfg))
			posts.POST("/:id/like", middleware.RequireAuth(cfg), handler.PostsLikeToggle(cfg))
			posts.GET("/:id/comments", handler.PostsCommentsList(cfg))
			posts.POST("/:id/comments", middleware.RequireAuth(cfg), handler.PostsCommentCreate(cfg))
		}

		api.GET("/audio/:filename", handler.ServeAudio)
		api.POST("/transcribe", middleware.RequireAuth(cfg), handler.AudioTranscribe(cfg))
	}

	return r
}
