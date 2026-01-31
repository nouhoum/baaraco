package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/baaraco/baara/pkg/apierror"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/minio"
)

type UploadsHandler struct {
	bucket string
}

func NewUploadsHandler() *UploadsHandler {
	return &UploadsHandler{
		bucket: getEnv("MINIO_BUCKET", "baara-uploads"),
	}
}

type PresignRequest struct {
	Filename    string `json:"filename" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
	Size        int64  `json:"size" binding:"required,gt=0"`
	Folder      string `json:"folder"` // Optional: subfolder like "work-samples"
}

type PresignResponse struct {
	UploadURL string `json:"upload_url"`
	ObjectKey string `json:"object_key"`
	ExpiresAt string `json:"expires_at"`
}

var allowedContentTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"image/webp":      true,
	"application/pdf": true,
	"video/mp4":       true,
	"video/webm":      true,
}

const maxFileSize = 50 * 1024 * 1024 // 50MB

// GeneratePresignedURL creates a presigned URL for direct upload to MinIO
// POST /uploads/presign
func (h *UploadsHandler) GeneratePresignedURL(c *gin.Context) {
	var req PresignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Validation
	errors := make(map[string]string)

	if !allowedContentTypes[req.ContentType] {
		errors["content_type"] = "Content type not allowed"
	}
	if req.Size > maxFileSize {
		errors["size"] = fmt.Sprintf("File size exceeds maximum (%d MB)", maxFileSize/1024/1024)
	}

	if len(errors) > 0 {
		apierror.ValidationFailed.SendWithDetails(c, errors)
		return
	}

	// Generate unique object key
	ext := filepath.Ext(req.Filename)
	timestamp := time.Now().UnixNano()
	sanitizedName := sanitizeFilename(strings.TrimSuffix(req.Filename, ext))

	var objectKey string
	if req.Folder != "" {
		objectKey = fmt.Sprintf("%s/%d-%s%s", req.Folder, timestamp, sanitizedName, ext)
	} else {
		objectKey = fmt.Sprintf("%d-%s%s", timestamp, sanitizedName, ext)
	}

	// Generate presigned URL (valid for 15 minutes)
	expiry := 15 * time.Minute
	uploadURL, err := minio.GeneratePresignedUploadURL(c.Request.Context(), h.bucket, objectKey, expiry)
	if err != nil {
		logger.Error("Failed to generate presigned URL", zap.Error(err))
		apierror.UploadError.Send(c)
		return
	}

	expiresAt := time.Now().Add(expiry)

	logger.Debug("Presigned URL generated",
		zap.String("object_key", objectKey),
		zap.String("content_type", req.ContentType),
		zap.Int64("size", req.Size),
	)

	c.JSON(http.StatusOK, PresignResponse{
		UploadURL: uploadURL,
		ObjectKey: objectKey,
		ExpiresAt: expiresAt.UTC().Format(time.RFC3339),
	})
}

func sanitizeFilename(name string) string {
	// Remove or replace unsafe characters
	name = strings.ToLower(name)
	name = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		if r == ' ' {
			return '-'
		}
		return -1
	}, name)

	// Limit length
	if len(name) > 50 {
		name = name[:50]
	}

	return name
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
