package handlers

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/minio"
	"github.com/baaraco/baara/pkg/redis"
)

type HealthHandler struct{}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{}
}

type HealthResponse struct {
	Status    string            `json:"status"`
	Timestamp string            `json:"timestamp"`
	Checks    map[string]string `json:"checks,omitempty"`
}

// Healthz is a simple liveness probe
// GET /healthz
func (h *HealthHandler) Healthz(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:    "ok",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}

// Readyz is a readiness probe that checks all dependencies
// GET /readyz
func (h *HealthHandler) Readyz(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 5*time.Second)
	defer cancel()

	checks := make(map[string]string)
	allOK := true

	// Check database
	if err := database.Ping(); err != nil {
		checks["database"] = "unhealthy: " + err.Error()
		allOK = false
	} else {
		checks["database"] = "healthy"
	}

	// Check Redis
	if err := redis.Ping(ctx); err != nil {
		checks["redis"] = "unhealthy: " + err.Error()
		allOK = false
	} else {
		checks["redis"] = "healthy"
	}

	// Check MinIO
	if err := minio.Ping(ctx); err != nil {
		checks["minio"] = "unhealthy: " + err.Error()
		allOK = false
	} else {
		checks["minio"] = "healthy"
	}

	status := "ok"
	statusCode := http.StatusOK
	if !allOK {
		status = "degraded"
		statusCode = http.StatusServiceUnavailable
	}

	c.JSON(statusCode, HealthResponse{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Checks:    checks,
	})
}
