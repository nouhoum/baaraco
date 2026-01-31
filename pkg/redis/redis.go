package redis

import (
	"context"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/logger"
)

var Client *redis.Client

type Config struct {
	Host     string
	Port     int
	Password string
	DB       int
}

func LoadConfigFromEnv() Config {
	port, err := strconv.Atoi(getEnv("REDIS_PORT", "6379"))
	if err != nil {
		port = 6379
	}
	db, err := strconv.Atoi(getEnv("REDIS_DB", "0"))
	if err != nil {
		db = 0
	}

	return Config{
		Host:     getEnv("REDIS_HOST", "localhost"),
		Port:     port,
		Password: getEnv("REDIS_PASSWORD", ""),
		DB:       db,
	}
}

func Connect(cfg Config) error {
	Client = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := Client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	logger.Info("Connected to Redis",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
	)

	return nil
}

func Close() error {
	if Client != nil {
		return Client.Close()
	}
	return nil
}

func Ping(ctx context.Context) error {
	if Client == nil {
		return fmt.Errorf("redis not initialized")
	}
	return Client.Ping(ctx).Err()
}

// Queue operations for worker
func Push(ctx context.Context, queue string, data []byte) error {
	if Client == nil {
		return fmt.Errorf("redis not initialized")
	}
	return Client.LPush(ctx, queue, data).Err()
}

func Pop(ctx context.Context, queue string, timeout time.Duration) ([]byte, error) {
	result, err := Client.BRPop(ctx, timeout, queue).Result()
	if err != nil {
		return nil, err
	}
	if len(result) < 2 {
		return nil, fmt.Errorf("unexpected result from BRPop")
	}
	return []byte(result[1]), nil
}

func Len(ctx context.Context, queue string) (int64, error) {
	return Client.LLen(ctx, queue).Result()
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
