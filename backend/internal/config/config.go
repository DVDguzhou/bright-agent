package config

import "os"

type Config struct {
	DatabaseURL    string
	SessionSecret  string
	SessionCookie  string
	PlatformKeyPrefix string
}

func Load() *Config {
	return &Config{
		DatabaseURL:    getEnv("DATABASE_URL", "root:password@tcp(localhost:3306)/agent_marketplace?charset=utf8mb4&parseTime=True"),
		SessionSecret:  getEnv("SESSION_SECRET", "change-me-in-production"),
		SessionCookie:  getEnv("SESSION_COOKIE", "agent_fiverr_session"),
		PlatformKeyPrefix: getEnv("PLATFORM_KEY_PREFIX", "sk_live_"),
	}
}

func getEnv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
