package middleware

import (
	"time"

	"github.com/baaraco/baara/pkg/logger"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

// RequestLogger logs incoming requests
func RequestLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		query := c.Request.URL.RawQuery

		c.Next()

		logger.Log.Info("request",
			zap.String("method", c.Request.Method),
			zap.String("path", path),
			zap.String("query", query),
			zap.Int("status", c.Writer.Status()),
			zap.Int("bytes", c.Writer.Size()),
			zap.Duration("duration", time.Since(start)),
			zap.String("ip", c.ClientIP()),
			zap.String("user_agent", c.Request.UserAgent()),
			zap.String("errors", c.Errors.ByType(gin.ErrorTypePrivate).String()),
		)
	}
}

// RealIP extracts the real client IP considering Cloudflare headers
func RealIP() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Cloudflare sets CF-Connecting-IP
		if cfIP := c.GetHeader("CF-Connecting-IP"); cfIP != "" {
			c.Request.RemoteAddr = cfIP
		} else if xrIP := c.GetHeader("X-Real-IP"); xrIP != "" {
			c.Request.RemoteAddr = xrIP
		} else if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
			// Take the first IP from the list
			for i, ch := range xff {
				if ch == ',' {
					xff = xff[:i]
					break
				}
			}
			c.Request.RemoteAddr = xff
		}
		c.Next()
	}
}

// SecurityHeaders adds security headers
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Next()
	}
}
