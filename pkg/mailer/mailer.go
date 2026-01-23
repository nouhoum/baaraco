package mailer

import (
	"fmt"
	"os"
	"strconv"

	"github.com/baaraco/baara/pkg/logger"
	"go.uber.org/zap"
	"gopkg.in/gomail.v2"
)

type Mailer interface {
	Send(to, subject, htmlBody, textBody string) error
}

type SMTPMailer struct {
	dialer   *gomail.Dialer
	from     string
	fromName string
}

type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	From     string
	FromName string
}

func LoadConfigFromEnv() Config {
	port, _ := strconv.Atoi(getEnv("SMTP_PORT", "587"))

	return Config{
		Host:     getEnv("SMTP_HOST", "smtp.mailtrap.io"),
		Port:     port,
		User:     getEnv("SMTP_USER", ""),
		Password: getEnv("SMTP_PASSWORD", ""),
		From:     getEnv("SMTP_FROM", "noreply@baara.co"),
		FromName: getEnv("SMTP_FROM_NAME", "Baara"),
	}
}

func NewSMTPMailer(cfg Config) (*SMTPMailer, error) {
	dialer := gomail.NewDialer(cfg.Host, cfg.Port, cfg.User, cfg.Password)

	logger.Info("SMTP mailer initialized",
		zap.String("host", cfg.Host),
		zap.Int("port", cfg.Port),
	)

	return &SMTPMailer{
		dialer:   dialer,
		from:     cfg.From,
		fromName: cfg.FromName,
	}, nil
}

func (m *SMTPMailer) Send(to, subject, htmlBody, textBody string) error {
	msg := gomail.NewMessage()
	msg.SetAddressHeader("From", m.from, m.fromName)
	msg.SetHeader("To", to)
	msg.SetHeader("Subject", subject)

	if htmlBody != "" {
		msg.SetBody("text/html", htmlBody)
		if textBody != "" {
			msg.AddAlternative("text/plain", textBody)
		}
	} else if textBody != "" {
		msg.SetBody("text/plain", textBody)
	} else {
		return fmt.Errorf("email body cannot be empty")
	}

	if err := m.dialer.DialAndSend(msg); err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	logger.Debug("Email sent",
		zap.String("to", to),
		zap.String("subject", subject),
	)

	return nil
}

// ConsoleMailer for development - prints emails to console
type ConsoleMailer struct{}

func NewConsoleMailer() *ConsoleMailer {
	logger.Info("Console mailer initialized (development mode)")
	return &ConsoleMailer{}
}

func (m *ConsoleMailer) Send(to, subject, htmlBody, textBody string) error {
	logger.Info("Email (console)",
		zap.String("to", to),
		zap.String("subject", subject),
		zap.String("body", textBody),
	)
	return nil
}

// Factory function
func New() (Mailer, error) {
	env := os.Getenv("APP_ENV")
	if env == "development" || env == "dev" || env == "" {
		// Check if SMTP is configured
		if os.Getenv("SMTP_USER") == "" {
			return NewConsoleMailer(), nil
		}
	}

	cfg := LoadConfigFromEnv()
	return NewSMTPMailer(cfg)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
