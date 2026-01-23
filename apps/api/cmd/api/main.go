package main

import (
	"log"
	"os"

	"github.com/baaraco/baara/apps/api/internal/config"
	"github.com/baaraco/baara/apps/api/internal/server"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/minio"
	"github.com/baaraco/baara/pkg/redis"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		// Not an error in production
		log.Println("No .env file found")
	}

	// Initialize logger
	if err := logger.Init(); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Load configuration
	cfg := config.Load()

	logger.Info("Starting Baara API",
		zap.String("env", cfg.Env),
		zap.Bool("debug", cfg.Debug),
	)

	// Connect to database
	dbCfg := database.LoadConfigFromEnv()
	if err := database.Connect(dbCfg); err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Connect to Redis
	redisCfg := redis.LoadConfigFromEnv()
	if err := redis.Connect(redisCfg); err != nil {
		logger.Fatal("Failed to connect to Redis", zap.Error(err))
	}
	defer redis.Close()

	// Connect to MinIO
	minioCfg := minio.LoadConfigFromEnv()
	if err := minio.Connect(minioCfg); err != nil {
		logger.Fatal("Failed to connect to MinIO", zap.Error(err))
	}

	// Create and start server
	srv := server.New(cfg)
	if err := srv.Start(); err != nil {
		logger.Fatal("Server error", zap.Error(err))
		os.Exit(1)
	}
}
