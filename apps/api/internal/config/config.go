package config

import (
	"os"
	"strings"
)

type Config struct {
	Env             string
	Debug           bool
	Host            string
	Port            string
	BaseURL         string
	CORSOrigins     []string
	JWTSecret       string
	WorkerQueueName string

	// Bootstrap admin (optional, for first-time setup)
	BootstrapAdminEmail string
	BootstrapAdminName  string
}

func Load() *Config {
	return &Config{
		Env:             getEnv("APP_ENV", "development"),
		Debug:           getEnv("APP_DEBUG", "true") == "true",
		Host:            getEnv("API_HOST", "0.0.0.0"),
		Port:            getEnv("API_PORT", "8080"),
		BaseURL:         getEnv("API_BASE_URL", "http://localhost:8080"),
		CORSOrigins:     strings.Split(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"), ","),
		JWTSecret:       getEnv("JWT_SECRET", "dev-secret-change-in-production"),
		WorkerQueueName: getEnv("WORKER_QUEUE_EMAIL", "email:queue"),

		// Bootstrap admin (optional)
		BootstrapAdminEmail: getEnv("BOOTSTRAP_ADMIN_EMAIL", ""),
		BootstrapAdminName:  getEnv("BOOTSTRAP_ADMIN_NAME", "Admin"),
	}
}

func (c *Config) IsDevelopment() bool {
	return c.Env == "development" || c.Env == "dev"
}

func (c *Config) IsProduction() bool {
	return c.Env == "production" || c.Env == "prod"
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
