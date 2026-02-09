package repositories

import (
	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

// UserRepository handles database operations for users
type UserRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new user repository
func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

// FindByEmail returns a user by email
func (r *UserRepository) FindByEmail(email string) (*models.User, error) {
	var user models.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByEmailWithOrg returns a user by email with org preloaded
func (r *UserRepository) FindByEmailWithOrg(email string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Org").Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByID returns a user by ID
func (r *UserRepository) FindByID(id string) (*models.User, error) {
	var user models.User
	err := r.db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// FindByIDWithOrg returns a user by ID with org preloaded
func (r *UserRepository) FindByIDWithOrg(id string) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Org").Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// Create creates a new user
func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

// Update saves changes to an existing user
func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}
