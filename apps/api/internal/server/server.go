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
	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type Server struct {
	cfg    *config.Config
	mailer mailer.Mailer
	router *gin.Engine
	http   *http.Server
}

func New(cfg *config.Config, m mailer.Mailer) *Server {
	// Set Gin mode
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()

	s := &Server{
		cfg:    cfg,
		mailer: m,
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
	fmt.Println("CORSOrigins:", s.cfg.CORSOrigins)
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

	// API routes
	api := s.router.Group("/api/v1")
	{
		// =============================================================================
		// Public routes (no auth required)
		// =============================================================================

		// Uploads
		uploadsHandler := handlers.NewUploadsHandler()
		api.POST("/uploads/presign", uploadsHandler.GeneratePresignedURL)

		// Candidate signups (pre-auth waitlist)
		candidateHandler := handlers.NewCandidateSignupHandler(s.cfg.WorkerQueueName)
		api.POST("/candidate-signups", candidateHandler.CreateSignup)

		// Pilot requests (recruiters pre-auth)
		pilotHandler := handlers.NewPilotRequestHandler(s.cfg.WorkerQueueName)
		api.POST("/pilot-requests", pilotHandler.CreatePilotRequest)
		api.PATCH("/pilot-requests/:id", pilotHandler.CompletePilotRequest)
		api.GET("/pilot-requests/:id", pilotHandler.GetPilotRequest)

		// =============================================================================
		// Auth routes (public)
		// =============================================================================
		authHandler := handlers.NewAuthHandler(s.mailer)
		auth := api.Group("/auth")
		{
			auth.POST("/start", authHandler.Start)
			auth.POST("/exchange", authHandler.Exchange)
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/me", authHandler.Me)
		}

		// =============================================================================
		// Invite routes (some public, some protected)
		// =============================================================================
		inviteHandler := handlers.NewInviteHandler(s.mailer)
		invites := api.Group("/invites")
		{
			// Public routes for accepting invites
			invites.GET("/:token", inviteHandler.GetInfo)
			invites.POST("/:token/accept", inviteHandler.Accept)

			// Protected route for creating invites
			invites.POST("", middleware.RequireAuth(), middleware.RequireRole(models.RoleAdmin, models.RoleRecruiter), inviteHandler.Create)
		}

		// =============================================================================
		// Protected routes (auth required)
		// =============================================================================

		// User profile routes
		userHandler := handlers.NewUserHandler()
		users := api.Group("/users")
		users.Use(middleware.RequireAuth())
		{
			users.GET("/me", userHandler.GetProfile)
			users.PATCH("/me", userHandler.UpdateProfile)
			users.POST("/me/onboarding", userHandler.CompleteOnboarding)
		}

		// Work sample attempt routes
		attemptHandler := handlers.NewWorkSampleAttemptHandler()
		evaluationHandler := handlers.NewEvaluationHandler()
		attempts := api.Group("/work-sample-attempts")
		attempts.Use(middleware.RequireAuth())
		{
			attempts.GET("/me", attemptHandler.GetMyAttempt)
			attempts.GET("/:id", attemptHandler.GetAttempt)
			attempts.PATCH("/:id", attemptHandler.SaveAttempt)
			attempts.POST("/:id/submit", attemptHandler.SubmitAttempt)
			attempts.POST("/:id/format-request", attemptHandler.RequestAlternativeFormat)
			attempts.GET("/:id/evaluation", evaluationHandler.GetEvaluationByAttempt)
		}

		// Evaluation routes
		proofProfileHandler := handlers.NewProofProfileHandler()
		evaluations := api.Group("/evaluations")
		evaluations.Use(middleware.RequireAuth())
		{
			evaluations.GET("/:id", evaluationHandler.GetEvaluation)
			evaluations.GET("/:id/proof-profile", proofProfileHandler.GetProofProfileByEvaluation)
		}

		// Proof profile routes
		proofProfiles := api.Group("/proof-profiles")
		proofProfiles.Use(middleware.RequireAuth())
		{
			proofProfiles.GET("/me", proofProfileHandler.GetMyProofProfile)
			proofProfiles.GET("/:id", proofProfileHandler.GetProofProfile)
		}

		// Format request routes (for recruiters/admins to manage)
		formatRequestHandler := handlers.NewFormatRequestHandler(s.mailer)
		formatRequests := api.Group("/format-requests")
		formatRequests.Use(middleware.RequireAuth())
		{
			formatRequests.GET("", formatRequestHandler.ListFormatRequests)
			formatRequests.GET("/pending-count", formatRequestHandler.GetPendingCount)
			formatRequests.GET("/:id", formatRequestHandler.GetFormatRequest)
			formatRequests.PATCH("/:id", formatRequestHandler.RespondToFormatRequest)
		}

		// Job routes (for recruiters/admins)
		jobHandler := handlers.NewJobHandler()
		scorecardHandler := handlers.NewScorecardHandler()
		workSampleHandler := handlers.NewJobWorkSampleHandler()
		jobs := api.Group("/jobs")
		jobs.Use(middleware.RequireAuth())
		{
			jobs.GET("", jobHandler.ListJobs)
			jobs.POST("", jobHandler.CreateJob)
			jobs.GET("/:id", jobHandler.GetJob)
			jobs.PATCH("/:id", jobHandler.UpdateJob)
			jobs.DELETE("/:id", jobHandler.DeleteJob)
			jobs.POST("/:id/publish", jobHandler.PublishJob)
			jobs.POST("/:id/pause", jobHandler.PauseJob)
			jobs.POST("/:id/close", jobHandler.CloseJob)

			// Scorecard routes
			jobs.POST("/:id/generate-scorecard", scorecardHandler.GenerateScorecard)
			jobs.GET("/:id/scorecard", scorecardHandler.GetScorecard)
			jobs.PATCH("/:id/scorecard", scorecardHandler.UpdateScorecard)

			// Work sample routes
			jobs.POST("/:id/generate-work-sample", workSampleHandler.GenerateWorkSample)
			jobs.GET("/:id/work-sample", workSampleHandler.GetWorkSample)
			jobs.PATCH("/:id/work-sample", workSampleHandler.UpdateWorkSample)

			// Evaluation routes for job
			jobs.GET("/:id/evaluations", evaluationHandler.ListEvaluationsForJob)

			// Proof profile routes for job
			jobs.GET("/:id/proof-profiles", proofProfileHandler.ListProofProfilesForJob)

			// Candidate dashboard routes for job
			jobCandidatesHandler := handlers.NewJobCandidatesHandler()
			jobs.GET("/:id/candidates", jobCandidatesHandler.ListJobCandidates)
			jobs.PATCH("/:id/candidates/:candidate_id", jobCandidatesHandler.UpdateCandidateStatus)
		}

		// =============================================================================
		// Admin routes (admin only)
		// =============================================================================

		// Admin pilot request management
		adminPilotHandler := handlers.NewAdminPilotHandler(s.mailer)
		adminPilots := api.Group("/admin/pilot-requests")
		adminPilots.Use(middleware.RequireAuth(), middleware.RequireAdmin())
		{
			adminPilots.GET("", adminPilotHandler.ListPilotRequests)
			adminPilots.GET("/:id", adminPilotHandler.GetPilotRequest)
			adminPilots.PATCH("/:id", adminPilotHandler.UpdatePilotRequest)
			adminPilots.POST("/:id/notes", adminPilotHandler.AddNote)
			adminPilots.POST("/:id/convert", adminPilotHandler.ConvertToRecruiter)
		}
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
