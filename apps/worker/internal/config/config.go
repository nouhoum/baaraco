package config

import (
	"os"
	"strconv"
)

type Config struct {
	Env               string
	Debug             bool
	Concurrency       int
	QueueEmail        string
	QueueEvaluation   string
	QueueProofProfile string
	QueueInterviewKit string
}

func Load() *Config {
	concurrency, err := strconv.Atoi(getEnv("WORKER_CONCURRENCY", "5"))
	if err != nil {
		concurrency = 5
	}

	return &Config{
		Env:               getEnv("APP_ENV", "development"),
		Debug:             getEnv("APP_DEBUG", "true") == "true",
		Concurrency:       concurrency,
		QueueEmail:        getEnv("WORKER_QUEUE_EMAIL", "email:queue"),
		QueueEvaluation:   getEnv("WORKER_QUEUE_EVALUATION", "evaluate_work_sample"),
		QueueProofProfile: getEnv("WORKER_QUEUE_PROOF_PROFILE", "generate_proof_profile"),
		QueueInterviewKit: getEnv("WORKER_QUEUE_INTERVIEW_KIT", "generate_interview_kit"),
	}
}

func (c *Config) IsDevelopment() bool {
	return c.Env == "development" || c.Env == "dev"
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
