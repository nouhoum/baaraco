package minio

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/logger"
)

var Client *minio.Client

type Config struct {
	Endpoint  string
	AccessKey string
	SecretKey string
	Bucket    string
	UseSSL    bool
	Region    string
}

func LoadConfigFromEnv() Config {
	useSSL, err := strconv.ParseBool(getEnv("MINIO_USE_SSL", "false"))
	if err != nil {
		useSSL = false
	}

	return Config{
		Endpoint:  getEnv("MINIO_ENDPOINT", "localhost:9000"),
		AccessKey: getEnv("MINIO_ACCESS_KEY", "minioadmin"),
		SecretKey: getEnv("MINIO_SECRET_KEY", "minioadmin"),
		Bucket:    getEnv("MINIO_BUCKET", "baara-uploads"),
		UseSSL:    useSSL,
		Region:    getEnv("MINIO_REGION", "us-east-1"),
	}
}

func Connect(cfg Config) error {
	var err error
	Client, err = minio.New(cfg.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.AccessKey, cfg.SecretKey, ""),
		Secure: cfg.UseSSL,
		Region: cfg.Region,
	})
	if err != nil {
		return fmt.Errorf("failed to create MinIO client: %w", err)
	}

	// Ensure bucket exists
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	exists, err := Client.BucketExists(ctx, cfg.Bucket)
	if err != nil {
		return fmt.Errorf("failed to check bucket: %w", err)
	}

	if !exists {
		err = Client.MakeBucket(ctx, cfg.Bucket, minio.MakeBucketOptions{
			Region: cfg.Region,
		})
		if err != nil {
			return fmt.Errorf("failed to create bucket: %w", err)
		}
		logger.Info("Created bucket", zap.String("bucket", cfg.Bucket))
	}

	logger.Info("Connected to MinIO",
		zap.String("endpoint", cfg.Endpoint),
		zap.String("bucket", cfg.Bucket),
	)

	return nil
}

// GeneratePresignedUploadURL generates a presigned URL for uploading
func GeneratePresignedUploadURL(ctx context.Context, bucket, objectName string, expiry time.Duration) (string, error) {
	if Client == nil {
		return "", fmt.Errorf("minio client not initialized")
	}

	presignedURL, err := Client.PresignedPutObject(ctx, bucket, objectName, expiry)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}

// GeneratePresignedDownloadURL generates a presigned URL for downloading
func GeneratePresignedDownloadURL(ctx context.Context, bucket, objectName string, expiry time.Duration) (string, error) {
	if Client == nil {
		return "", fmt.Errorf("minio client not initialized")
	}

	reqParams := make(url.Values)
	presignedURL, err := Client.PresignedGetObject(ctx, bucket, objectName, expiry, reqParams)
	if err != nil {
		return "", fmt.Errorf("failed to generate presigned URL: %w", err)
	}

	return presignedURL.String(), nil
}

// DownloadFile downloads a file from MinIO and returns its content
func DownloadFile(ctx context.Context, bucket, objectName string) ([]byte, error) {
	if Client == nil {
		return nil, fmt.Errorf("minio client not initialized")
	}

	object, err := Client.GetObject(ctx, bucket, objectName, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	defer object.Close()

	return io.ReadAll(object)
}

func Ping(ctx context.Context) error {
	if Client == nil {
		return fmt.Errorf("minio not initialized")
	}
	bucket := getEnv("MINIO_BUCKET", "baara-uploads")
	_, err := Client.BucketExists(ctx, bucket)
	return err
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
