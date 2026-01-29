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
	// Load .env file if it exists (try multiple locations for dev flexibility)
	if err := godotenv.Load(); err != nil {
		if err := godotenv.Load("../../.env"); err != nil {
			log.Println("No .env file found")
		}
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

	// Initialize mailer
	mail, err := mailer.New()
	if err != nil {
		logger.Fatal("Failed to initialize mailer", zap.Error(err))
	}

	// Create processors
	emailProcessor := jobs.NewEmailProcessor(mail)
	evaluationProcessor := jobs.NewEvaluationProcessor()
	proofProfileProcessor := jobs.NewProofProfileProcessor()
	interviewKitProcessor := jobs.NewInterviewKitProcessor()

	// Create and start consumers
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Email consumer
	emailConsumer := consumer.New(cfg.QueueEmail, cfg.Concurrency, emailProcessor)
	emailConsumer.Start(ctx)

	// Evaluation consumer (lower concurrency since it's AI-heavy)
	evalConcurrency := cfg.Concurrency / 2
	if evalConcurrency < 1 {
		evalConcurrency = 1
	}
	evalConsumer := consumer.New(cfg.QueueEvaluation, evalConcurrency, evaluationProcessor)
	evalConsumer.Start(ctx)

	// Proof profile consumer (lightweight data formatting)
	proofProfileConsumer := consumer.New(cfg.QueueProofProfile, cfg.Concurrency, proofProfileProcessor)
	proofProfileConsumer.Start(ctx)

	// Interview kit consumer (AI-heavy, lower concurrency)
	interviewKitConsumer := consumer.New(cfg.QueueInterviewKit, evalConcurrency, interviewKitProcessor)
	interviewKitConsumer.Start(ctx)

	logger.Info("All consumers started",
		zap.String("email_queue", cfg.QueueEmail),
		zap.String("eval_queue", cfg.QueueEvaluation),
		zap.String("proof_profile_queue", cfg.QueueProofProfile),
		zap.String("interview_kit_queue", cfg.QueueInterviewKit),
	)

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	logger.Info("Shutting down worker...")
	emailConsumer.Stop()
	evalConsumer.Stop()
	proofProfileConsumer.Stop()
	interviewKitConsumer.Stop()
	logger.Info("Worker stopped gracefully")
}
