package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/baaraco/baara/pkg/database"
	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/models"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

type Manifest struct {
	Version     string       `json:"version"`
	Description string       `json:"description"`
	Samples     []SampleData `json:"samples"`
}

type SampleData struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	URL         string   `json:"url"`
	FileType    string   `json:"file_type"`
	Tags        []string `json:"tags"`
}

func main() {
	// Load .env file if it exists
	godotenv.Load()

	// Parse flags
	manifestPath := flag.String("manifest", "configs/work_samples_manifest.json", "Path to manifest JSON file")
	userID := flag.String("user-id", "", "User ID to assign samples to (optional for demo)")
	dryRun := flag.Bool("dry-run", false, "Print what would be done without making changes")
	flag.Parse()

	// Initialize logger
	if err := logger.Init(); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	// Connect to database
	dbCfg := database.LoadConfigFromEnv()
	if err := database.Connect(dbCfg); err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer database.Close()

	// Read manifest file
	data, err := os.ReadFile(*manifestPath)
	if err != nil {
		logger.Fatal("Failed to read manifest file",
			zap.String("path", *manifestPath),
			zap.Error(err),
		)
	}

	var manifest Manifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		logger.Fatal("Failed to parse manifest JSON", zap.Error(err))
	}

	logger.Info("Loaded manifest",
		zap.String("version", manifest.Version),
		zap.Int("samples_count", len(manifest.Samples)),
	)

	// Validate samples
	for i, sample := range manifest.Samples {
		if sample.Title == "" {
			logger.Fatal("Invalid sample: missing title",
				zap.Int("index", i),
			)
		}
	}

	if *dryRun {
		fmt.Println("\n=== DRY RUN ===")
		fmt.Printf("Would seed %d work samples\n", len(manifest.Samples))
		for i, sample := range manifest.Samples {
			fmt.Printf("%d. %s\n", i+1, sample.Title)
			fmt.Printf("   URL: %s\n", sample.URL)
			fmt.Printf("   Type: %s\n", sample.FileType)
		}
		fmt.Println("\nNo changes made.")
		return
	}

	// Seed work samples (UPSERT based on title)
	seeded := 0
	updated := 0

	for i, sample := range manifest.Samples {
		workSample := models.WorkSample{
			Title:       sample.Title,
			Description: sample.Description,
			URL:         sample.URL,
			FileType:    sample.FileType,
			Order:       i,
		}

		if *userID != "" {
			workSample.UserID = *userID
		}

		// Try to find existing by title
		var existing models.WorkSample
		result := database.DB.Where("title = ?", sample.Title).First(&existing)

		if result.Error == nil {
			// Update existing
			workSample.ID = existing.ID
			workSample.UserID = existing.UserID // Preserve user ID
			if err := database.DB.Save(&workSample).Error; err != nil {
				logger.Error("Failed to update work sample",
					zap.String("title", sample.Title),
					zap.Error(err),
				)
				continue
			}
			updated++
			logger.Debug("Updated work sample", zap.String("title", sample.Title))
		} else {
			// Create new
			if err := database.DB.Create(&workSample).Error; err != nil {
				logger.Error("Failed to create work sample",
					zap.String("title", sample.Title),
					zap.Error(err),
				)
				continue
			}
			seeded++
			logger.Debug("Created work sample", zap.String("title", sample.Title))
		}
	}

	logger.Info("Seed completed",
		zap.Int("created", seeded),
		zap.Int("updated", updated),
		zap.Int("total", len(manifest.Samples)),
	)

	fmt.Printf("\n✓ Seed completed: %d created, %d updated\n", seeded, updated)
}
