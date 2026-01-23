package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/baaraco/baara/apps/worker/internal/config"
	"github.com/baaraco/baara/apps/worker/internal/consumer"
	"github.com/baaraco/baara/apps/worker/internal/jobs"
	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/redis"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize logger
	if err := logger.Init(); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Load configuration
	cfg := config.Load()

	logger.Info("Starting Baara Worker",
		zap.String("env", cfg.Env),
		zap.Int("concurrency", cfg.Concurrency),
	)

	// Connect to database (for potential future use)
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

	// Initialize mailer
	mail, err := mailer.New()
	if err != nil {
		logger.Fatal("Failed to initialize mailer", zap.Error(err))
	}

	// Create email processor
	emailProcessor := jobs.NewEmailProcessor(mail)

	// Create and start consumer
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cons := consumer.New(cfg.QueueEmail, cfg.Concurrency, emailProcessor)
	cons.Start(ctx)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down worker...")
	cons.Stop()
	logger.Info("Worker stopped gracefully")
}
