package main

import (
	"flag"
	"fmt"
	"log"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if it exists
	godotenv.Load()

	// Parse command line flags
	direction := flag.String("direction", "up", "Migration direction: up, down, or version")
	steps := flag.Int("steps", 0, "Number of migrations to run (0 = all)")
	version := flag.Uint("version", 0, "Specific version to migrate to")
	migrationsPath := flag.String("path", "file://db/migrations", "Path to migrations directory")
	flag.Parse()

	// Get database URL
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	// Create migrate instance
	m, err := migrate.New(*migrationsPath, dbURL)
	if err != nil {
		log.Fatalf("Failed to create migrate instance: %v", err)
	}
	defer m.Close()

	// Get current version
	currentVersion, dirty, err := m.Version()
	if err != nil && err != migrate.ErrNilVersion {
		log.Fatalf("Failed to get current version: %v", err)
	}

	fmt.Printf("Current version: %d (dirty: %v)\n", currentVersion, dirty)

	// Run migration based on direction
	switch *direction {
	case "up":
		if *steps > 0 {
			err = m.Steps(*steps)
		} else {
			err = m.Up()
		}
	case "down":
		if *steps > 0 {
			err = m.Steps(-*steps)
		} else {
			err = m.Down()
		}
	case "version":
		if *version > 0 {
			err = m.Migrate(*version)
		} else {
			fmt.Println("Please specify a version with -version flag")
			return
		}
	case "force":
		if *version > 0 {
			err = m.Force(int(*version))
		} else {
			fmt.Println("Please specify a version with -version flag")
			return
		}
	default:
		log.Fatalf("Unknown direction: %s", *direction)
	}

	if err != nil {
		if err == migrate.ErrNoChange {
			fmt.Println("No migrations to apply")
		} else {
			log.Fatalf("Migration failed: %v", err)
		}
	} else {
		fmt.Println("Migration completed successfully")
	}

	// Print new version
	newVersion, _, _ := m.Version()
	fmt.Printf("New version: %d\n", newVersion)
}
