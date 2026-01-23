package server

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/baaraco/baara/apps/api/internal/config"
	"github.com/baaraco/baara/apps/api/internal/handlers"
	"github.com/baaraco/baara/apps/api/internal/middleware"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Server struct {
	cfg    *config.Config
	router *gin.Engine
	http   *http.Server
}

func New(cfg *config.Config) *Server {
	// Set Gin mode
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	s := &Server{
		cfg:    cfg,
		router: r,
	}

	s.setupMiddleware()
	s.setupRoutes()

	s.http = &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	return s
}

func (s *Server) setupMiddleware() {
	// Recovery
	s.router.Use(gin.Recovery())

	// Real IP (Cloudflare)
	s.router.Use(middleware.RealIP())

	// Security headers
	s.router.Use(middleware.SecurityHeaders())

	// CORS
	s.router.Use(cors.New(cors.Config{
		AllowOrigins:     s.cfg.CORSOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposeHeaders:    []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           5 * time.Minute,
	}))

	// Logging
	s.router.Use(middleware.RequestLogger())
}

func (s *Server) setupRoutes() {
	// Health checks (no auth required)
	healthHandler := handlers.NewHealthHandler()
	s.router.GET("/healthz", healthHandler.Healthz)
	s.router.GET("/readyz", healthHandler.Readyz)

	// Public API
	public := s.router.Group("/public")
	{
		waitlistHandler := handlers.NewWaitlistHandler(s.cfg.WorkerQueueName)
		public.POST("/waitlist/recruiter", waitlistHandler.RegisterRecruiter)
		public.POST("/waitlist/candidate", waitlistHandler.RegisterCandidate)
	}

	// API routes (could add auth middleware later)
	api := s.router.Group("/api/v1")
	{
		// Uploads
		uploadsHandler := handlers.NewUploadsHandler()
		api.POST("/uploads/presign", uploadsHandler.GeneratePresignedURL)
	}

	// 404 handler
	s.router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Not found"})
	})

	// 405 handler
	s.router.NoMethod(func(c *gin.Context) {
		c.JSON(http.StatusMethodNotAllowed, gin.H{"error": "Method not allowed"})
	})
}

func (s *Server) Start() error {
	logger.Info("Starting API server",
		zap.String("host", s.cfg.Host),
		zap.String("port", s.cfg.Port),
	)

	// Channel to listen for interrupt signals
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// Start server in goroutine
	go func() {
		if err := s.http.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server error", zap.Error(err))
		}
	}()

	logger.Info("API server started",
		zap.String("address", s.http.Addr),
	)

	// Wait for interrupt signal
	<-quit
	logger.Info("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := s.http.Shutdown(ctx); err != nil {
		return fmt.Errorf("server forced to shutdown: %w", err)
	}

	logger.Info("Server stopped gracefully")
	return nil
}
