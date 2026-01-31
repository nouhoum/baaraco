package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type JobStatus string

const (
	JobStatusDraft  JobStatus = "draft"
	JobStatusActive JobStatus = "active"
	JobStatusPaused JobStatus = "paused"
	JobStatusClosed JobStatus = "closed"
)

type LocationType string

const (
	LocationTypeRemote LocationType = "remote"
	LocationTypeHybrid LocationType = "hybrid"
	LocationTypeOnsite LocationType = "onsite"
)

type ContractType string

const (
	ContractTypeCDI       ContractType = "cdi"
	ContractTypeCDD       ContractType = "cdd"
	ContractTypeFreelance ContractType = "freelance"
)

type SeniorityLevel string

const (
	SeniorityJunior    SeniorityLevel = "junior"
	SeniorityMid       SeniorityLevel = "mid"
	SenioritySenior    SeniorityLevel = "senior"
	SeniorityStaff     SeniorityLevel = "staff"
	SeniorityPrincipal SeniorityLevel = "principal"
)

type TeamSize string

const (
	TeamSize1to3   TeamSize = "1-3"
	TeamSize4to8   TeamSize = "4-8"
	TeamSize9to15  TeamSize = "9-15"
	TeamSize16Plus TeamSize = "16+"
)

type Urgency string

const (
	UrgencyImmediate  Urgency = "immediate"
	Urgency1to2Months Urgency = "1-2months"
	UrgencyFlexible   Urgency = "flexible"
)

// Job represents a job position for hiring
type Job struct {
	ID     string    `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	OrgID  string    `gorm:"type:uuid;not null" json:"org_id"`
	Org    *Org      `gorm:"foreignKey:OrgID" json:"org,omitempty"`
	Status JobStatus `gorm:"type:varchar(20);default:'draft'" json:"status"`

	// Section 1: Le poste
	Title        string         `gorm:"not null" json:"title"`
	Team         string         `json:"team,omitempty"`
	LocationType LocationType   `gorm:"type:varchar(20)" json:"location_type,omitempty"`
	LocationCity string         `json:"location_city,omitempty"`
	ContractType ContractType   `gorm:"type:varchar(20)" json:"contract_type,omitempty"`
	Seniority    SeniorityLevel `gorm:"type:varchar(20)" json:"seniority,omitempty"`

	// Section 2: Le contexte
	Stack           json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"stack,omitempty"` // Array of strings
	TeamSize        TeamSize        `gorm:"type:varchar(10)" json:"team_size,omitempty"`
	ManagerInfo     string          `json:"manager_info,omitempty"`
	BusinessContext string          `json:"business_context,omitempty"`

	// Section 3: Les outcomes
	MainProblem      string          `json:"main_problem,omitempty"`
	ExpectedOutcomes json.RawMessage `gorm:"type:jsonb;default:'[]'" json:"expected_outcomes,omitempty"` // Array of strings
	SuccessLooksLike string          `json:"success_looks_like,omitempty"`
	FailureLooksLike string          `json:"failure_looks_like,omitempty"`

	// Section 4: Logistique
	SalaryMin *int       `json:"salary_min,omitempty"`
	SalaryMax *int       `json:"salary_max,omitempty"`
	StartDate *time.Time `json:"start_date,omitempty"`
	Urgency   Urgency    `gorm:"type:varchar(20)" json:"urgency,omitempty"`

	// Legacy fields
	Description  string  `json:"description,omitempty"`
	RoleType     string  `json:"role_type,omitempty"` // backend_go, infra_platform, sre, etc.
	WorkSampleID *string `gorm:"type:uuid" json:"work_sample_id,omitempty"`

	// Metadata
	CreatedBy *string        `gorm:"type:uuid" json:"created_by,omitempty"`
	Creator   *User          `gorm:"foreignKey:CreatedBy" json:"creator,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Job) TableName() string {
	return "jobs"
}

// JobResponse is the API response for a job
type JobResponse struct {
	ID     string    `json:"id"`
	OrgID  string    `json:"org_id"`
	Status JobStatus `json:"status"`

	// Section 1: Le poste
	Title        string         `json:"title"`
	Team         string         `json:"team,omitempty"`
	LocationType LocationType   `json:"location_type,omitempty"`
	LocationCity string         `json:"location_city,omitempty"`
	ContractType ContractType   `json:"contract_type,omitempty"`
	Seniority    SeniorityLevel `json:"seniority,omitempty"`

	// Section 2: Le contexte
	Stack           []string `json:"stack,omitempty"`
	TeamSize        TeamSize `json:"team_size,omitempty"`
	ManagerInfo     string   `json:"manager_info,omitempty"`
	BusinessContext string   `json:"business_context,omitempty"`

	// Section 3: Les outcomes
	MainProblem      string   `json:"main_problem,omitempty"`
	ExpectedOutcomes []string `json:"expected_outcomes,omitempty"`
	SuccessLooksLike string   `json:"success_looks_like,omitempty"`
	FailureLooksLike string   `json:"failure_looks_like,omitempty"`

	// Section 4: Logistique
	SalaryMin *int       `json:"salary_min,omitempty"`
	SalaryMax *int       `json:"salary_max,omitempty"`
	StartDate *time.Time `json:"start_date,omitempty"`
	Urgency   Urgency    `json:"urgency,omitempty"`

	// Legacy/Other
	Description string `json:"description,omitempty"`
	RoleType    string `json:"role_type,omitempty"`

	// Relations
	Org       *OrgResponse  `json:"org,omitempty"`
	CreatedBy *string       `json:"created_by,omitempty"`
	Creator   *UserResponse `json:"creator,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

// ToResponse converts a Job to its API response
func (j *Job) ToResponse() *JobResponse {
	resp := &JobResponse{
		ID:               j.ID,
		OrgID:            j.OrgID,
		Status:           j.Status,
		Title:            j.Title,
		Team:             j.Team,
		LocationType:     j.LocationType,
		LocationCity:     j.LocationCity,
		ContractType:     j.ContractType,
		Seniority:        j.Seniority,
		TeamSize:         j.TeamSize,
		ManagerInfo:      j.ManagerInfo,
		BusinessContext:  j.BusinessContext,
		MainProblem:      j.MainProblem,
		SuccessLooksLike: j.SuccessLooksLike,
		FailureLooksLike: j.FailureLooksLike,
		SalaryMin:        j.SalaryMin,
		SalaryMax:        j.SalaryMax,
		StartDate:        j.StartDate,
		Urgency:          j.Urgency,
		Description:      j.Description,
		RoleType:         j.RoleType,
		CreatedBy:        j.CreatedBy,
		CreatedAt:        j.CreatedAt,
		UpdatedAt:        j.UpdatedAt,
	}

	// Parse stack from JSON
	if len(j.Stack) > 0 {
		var stack []string
		if err := json.Unmarshal(j.Stack, &stack); err == nil {
			resp.Stack = stack
		}
	}

	// Parse expected outcomes from JSON
	if len(j.ExpectedOutcomes) > 0 {
		var outcomes []string
		if err := json.Unmarshal(j.ExpectedOutcomes, &outcomes); err == nil {
			resp.ExpectedOutcomes = outcomes
		}
	}

	if j.Org != nil {
		resp.Org = j.Org.ToResponse()
	}
	if j.Creator != nil {
		resp.Creator = j.Creator.ToResponse()
	}

	return resp
}

// JobListResponse is a minimal response for job listings
type JobListResponse struct {
	ID           string         `json:"id"`
	Title        string         `json:"title"`
	Team         string         `json:"team,omitempty"`
	Status       JobStatus      `json:"status"`
	LocationType LocationType   `json:"location_type,omitempty"`
	Seniority    SeniorityLevel `json:"seniority,omitempty"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// ToListResponse converts a Job to its list API response
func (j *Job) ToListResponse() *JobListResponse {
	return &JobListResponse{
		ID:           j.ID,
		Title:        j.Title,
		Team:         j.Team,
		Status:       j.Status,
		LocationType: j.LocationType,
		Seniority:    j.Seniority,
		CreatedAt:    j.CreatedAt,
		UpdatedAt:    j.UpdatedAt,
	}
}
