package handlers

import (
	"context"
	"encoding/base64"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/ai"
	"github.com/baaraco/baara/pkg/apierror"
	miniopkg "github.com/baaraco/baara/pkg/minio"
)

type ResumeHandler struct{}

func NewResumeHandler() *ResumeHandler {
	return &ResumeHandler{}
}

type ParseResumeRequest struct {
	ObjectKey string `json:"object_key" binding:"required"`
}

// ParseResume downloads a PDF from MinIO and extracts structured data using AI
// POST /api/v1/resume/parse
func (h *ResumeHandler) ParseResume(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		apierror.NotAuthenticated.Send(c)
		return
	}

	var req ParseResumeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		apierror.InvalidData.Send(c)
		return
	}

	// Download PDF from MinIO
	bucket := os.Getenv("MINIO_BUCKET")
	if bucket == "" {
		bucket = "baara-uploads"
	}

	pdfContent, err := miniopkg.DownloadFile(context.Background(), bucket, req.ObjectKey)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to download file"})
		return
	}

	// Convert to base64
	pdfBase64 := base64.StdEncoding.EncodeToString(pdfContent)

	// Parse with AI
	aiClient := ai.NewClient()
	result, err := aiClient.ParseResume(pdfBase64)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse resume"})
		return
	}

	c.JSON(http.StatusOK, result)
}
