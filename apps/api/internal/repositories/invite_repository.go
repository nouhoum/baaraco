package repositories

import (
	"time"

	"gorm.io/gorm"

	"github.com/baaraco/baara/pkg/models"
)

type InviteRepository struct {
	db *gorm.DB
}

func NewInviteRepository(db *gorm.DB) *InviteRepository {
	return &InviteRepository{db: db}
}

func (r *InviteRepository) FindByTokenHash(tokenHash string) (*models.Invite, error) {
	var invite models.Invite
	err := r.db.Preload("Org").Preload("Job").Where("token_hash = ?", tokenHash).First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}

func (r *InviteRepository) FindPendingByEmail(email string) (*models.Invite, error) {
	var invite models.Invite
	err := r.db.Where("email = ? AND accepted_at IS NULL AND expires_at > ?", email, time.Now()).First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}

func (r *InviteRepository) FindPendingByEmailAndJob(email, jobID string) (*models.Invite, error) {
	var invite models.Invite
	err := r.db.Where("email = ? AND job_id = ? AND accepted_at IS NULL AND expires_at > ?", email, jobID, time.Now()).First(&invite).Error
	if err != nil {
		return nil, err
	}
	return &invite, nil
}

func (r *InviteRepository) Create(invite *models.Invite) error {
	return r.db.Create(invite).Error
}

func (r *InviteRepository) Update(invite *models.Invite) error {
	return r.db.Save(invite).Error
}
