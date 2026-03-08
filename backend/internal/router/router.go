package router

import (
	"github.com/agent-marketplace/backend/internal/config"
	"github.com/agent-marketplace/backend/internal/handler"
	"github.com/agent-marketplace/backend/internal/middleware"
	"github.com/gin-gonic/gin"
)

func Setup(cfg *config.Config) *gin.Engine {
	r := gin.Default()
	r.Use(middleware.CORS())

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/login", handler.Login(cfg))
			auth.POST("/signup", handler.Signup(cfg))
			auth.POST("/logout", handler.Logout(cfg))
			auth.GET("/me", middleware.RequireAuth(cfg), handler.Me(cfg))
		}

		agents := api.Group("/agents")
		{
			agents.GET("", middleware.Auth(cfg), handler.AgentsList(cfg))
			agents.POST("", middleware.RequireAuth(cfg), handler.AgentsCreate(cfg))
			agents.GET("/:id", handler.AgentsGet(cfg))
			agents.PATCH("/:id", middleware.RequireAuth(cfg), handler.AgentsUpdate(cfg))
		}

		licenses := api.Group("/licenses")
		{
			licenses.GET("", middleware.RequireAuth(cfg), handler.LicensesList(cfg))
			licenses.POST("", middleware.RequireAuth(cfg), handler.LicensesCreate(cfg))
		}

		lifeAgents := api.Group("/life-agents")
		{
			lifeAgents.GET("", handler.LifeAgentsList(cfg))
			lifeAgents.POST("", middleware.RequireAuth(cfg), handler.LifeAgentsCreate(cfg))
			lifeAgents.GET("/mine", middleware.RequireAuth(cfg), handler.LifeAgentsMine(cfg))
			lifeAgents.GET("/:id", middleware.Auth(cfg), handler.LifeAgentsGet(cfg))
			lifeAgents.PATCH("/:id", middleware.RequireAuth(cfg), handler.LifeAgentsUpdate(cfg))
			lifeAgents.GET("/:id/manage", middleware.RequireAuth(cfg), handler.LifeAgentsManage(cfg))
			lifeAgents.POST("/:id/purchase", middleware.RequireAuth(cfg), handler.LifeAgentsPurchase(cfg))
			lifeAgents.POST("/:id/chat", middleware.RequireAuth(cfg), handler.LifeAgentsChat(cfg))
		}

		api.GET("/user-api-keys", middleware.RequireAuth(cfg), handler.UserAPIKeysList(cfg))
		api.POST("/user-api-keys", middleware.RequireAuth(cfg), handler.UserAPIKeysCreate(cfg))
		api.DELETE("/user-api-keys/:id", middleware.RequireAuth(cfg), handler.UserAPIKeysDelete(cfg))

		api.POST("/invocations/issue-token", middleware.RequireAuth(cfg), handler.InvocationsIssueToken(cfg))
	}

	return r
}
