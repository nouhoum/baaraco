package apierror

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIError represents a structured API error with a machine-readable code.
type APIError struct {
	Code       string
	StatusCode int
	Fallback   string
}

// Send writes the error JSON response.
func (e *APIError) Send(c *gin.Context) {
	c.JSON(e.StatusCode, gin.H{
		"code":  e.Code,
		"error": e.Fallback,
	})
}

// SendWithDetails writes the error JSON response with additional details.
func (e *APIError) SendWithDetails(c *gin.Context, details map[string]string) {
	c.JSON(e.StatusCode, gin.H{
		"code":    e.Code,
		"error":   e.Fallback,
		"details": details,
	})
}

// Abort sends the error and aborts the middleware chain.
func (e *APIError) Abort(c *gin.Context) {
	c.AbortWithStatusJSON(e.StatusCode, gin.H{
		"code":  e.Code,
		"error": e.Fallback,
	})
}

// --- Auth errors ---

var NotAuthenticated = &APIError{"auth.not_authenticated", http.StatusUnauthorized, "Not authenticated"}
var SessionInvalid = &APIError{"auth.session_invalid", http.StatusUnauthorized, "Invalid or expired session"}
var UserNotFound = &APIError{"auth.user_not_found", http.StatusUnauthorized, "User not found"}
var AccountDisabled = &APIError{"auth.account_disabled", http.StatusUnauthorized, "Account disabled"}
var AccessDenied = &APIError{"auth.access_denied", http.StatusForbidden, "Access denied"}
var RoleRequired = &APIError{"auth.role_required", http.StatusForbidden, "Insufficient permissions"}
var OrgMismatch = &APIError{"auth.org_mismatch", http.StatusForbidden, "Organization access denied"}
var InvalidToken = &APIError{"auth.invalid_token", http.StatusUnauthorized, "Invalid or expired token"}

// --- Validation errors ---

var InvalidData = &APIError{"validation.invalid_data", http.StatusBadRequest, "Invalid data"}
var MissingField = &APIError{"validation.missing_field", http.StatusBadRequest, "Required field missing"}
var InvalidEmail = &APIError{"validation.invalid_email", http.StatusBadRequest, "Invalid email"}
var InvalidStatus = &APIError{"validation.invalid_status", http.StatusBadRequest, "Invalid status"}
var InvalidRole = &APIError{"validation.invalid_role", http.StatusBadRequest, "Invalid role"}
var ValidationFailed = &APIError{"validation.failed", http.StatusBadRequest, "Validation failed"}

// --- Resource not found errors ---

var JobNotFound = &APIError{"resource.job_not_found", http.StatusNotFound, "Job not found"}
var CandidateNotFound = &APIError{"resource.candidate_not_found", http.StatusNotFound, "Candidate not found"}
var AttemptNotFound = &APIError{"resource.attempt_not_found", http.StatusNotFound, "Attempt not found"}
var EvaluationNotFound = &APIError{"resource.evaluation_not_found", http.StatusNotFound, "Evaluation not found"}
var ProofProfileNotFound = &APIError{"resource.proof_profile_not_found", http.StatusNotFound, "Proof profile not found"}
var InterviewKitNotFound = &APIError{"resource.interview_kit_not_found", http.StatusNotFound, "Interview kit not found"}
var DecisionMemoNotFound = &APIError{"resource.decision_memo_not_found", http.StatusNotFound, "Decision memo not found"}
var ScorecardNotFound = &APIError{"resource.scorecard_not_found", http.StatusNotFound, "Scorecard not found"}
var WorkSampleNotFound = &APIError{"resource.work_sample_not_found", http.StatusNotFound, "Work sample not found"}
var InviteNotFound = &APIError{"resource.invite_not_found", http.StatusNotFound, "Invite not found"}
var PilotRequestNotFound = &APIError{"resource.pilot_request_not_found", http.StatusNotFound, "Request not found"}
var FormatRequestNotFound = &APIError{"resource.format_request_not_found", http.StatusNotFound, "Format request not found"}
var ResourceNotAvailable = &APIError{"resource.not_available", http.StatusNotFound, "Resource not available"}

// --- Business rule errors ---

var AlreadySubmitted = &APIError{"business.already_submitted", http.StatusBadRequest, "Already submitted"}
var NotEditable = &APIError{"business.not_editable", http.StatusBadRequest, "Cannot be edited"}
var AlreadyExists = &APIError{"business.already_exists", http.StatusConflict, "Already exists"}
var InviteExpired = &APIError{"business.invite_expired", http.StatusGone, "Invite expired or already used"}
var AlreadyConverted = &APIError{"business.already_converted", http.StatusConflict, "Already converted"}
var NoScorecard = &APIError{"business.no_scorecard", http.StatusBadRequest, "Scorecard required first"}
var MissingRequiredFields = &APIError{"business.missing_required_fields", http.StatusBadRequest, "Required fields missing"}
var DecisionRequired = &APIError{"business.decision_required", http.StatusBadRequest, "Decision required"}
var JustificationRequired = &APIError{"business.justification_required", http.StatusBadRequest, "Justification required"}
var DuplicateRequest = &APIError{"business.duplicate_request", http.StatusBadRequest, "Duplicate request"}
var NoContent = &APIError{"business.no_content", http.StatusBadRequest, "No content provided"}
var NoOrg = &APIError{"business.no_org", http.StatusBadRequest, "Organization required"}
var RecruiterCannotInvite = &APIError{"business.recruiter_cannot_invite", http.StatusForbidden, "Recruiters can only invite candidates"}
var CandidateCannotInvite = &APIError{"business.candidate_cannot_invite", http.StatusForbidden, "Candidates cannot send invites"}
var UserAlreadyRecruiter = &APIError{"business.user_already_recruiter", http.StatusConflict, "User is already a recruiter with an organization"}
var UserIsAdmin = &APIError{"business.user_is_admin", http.StatusConflict, "User is an administrator"}
var DuplicateAttempt = &APIError{"business.duplicate_attempt", http.StatusConflict, "Candidate already has a work sample for this job"}
var InvalidName = &APIError{"validation.invalid_name", http.StatusBadRequest, "Name required (minimum 2 characters)"}
var InvalidProgress = &APIError{"validation.invalid_progress", http.StatusBadRequest, "Progress must be between 0 and 100"}
var InvalidFormat = &APIError{"validation.invalid_format", http.StatusBadRequest, "Invalid preferred format"}
var InvalidReason = &APIError{"validation.invalid_reason", http.StatusBadRequest, "Invalid reason"}
var AlreadyProcessed = &APIError{"business.already_processed", http.StatusBadRequest, "Already processed"}
var TemplateNotFound = &APIError{"resource.template_not_found", http.StatusNotFound, "Template not found for this role"}
var CooldownActive = &APIError{"business.cooldown_active", http.StatusConflict, "You must wait before retaking the evaluation"}
var InvalidRoleType = &APIError{"validation.invalid_role_type", http.StatusBadRequest, "Invalid role type"}

// --- Server errors ---

var InternalError = &APIError{"server.internal_error", http.StatusInternalServerError, "Internal server error"}
var FetchError = &APIError{"server.fetch_error", http.StatusInternalServerError, "Failed to fetch data"}
var CreateError = &APIError{"server.create_error", http.StatusInternalServerError, "Failed to create resource"}
var UpdateError = &APIError{"server.update_error", http.StatusInternalServerError, "Failed to update resource"}
var DeleteError = &APIError{"server.delete_error", http.StatusInternalServerError, "Failed to delete resource"}
var SessionError = &APIError{"server.session_error", http.StatusInternalServerError, "Failed to create session"}
var SerializationError = &APIError{"server.serialization_error", http.StatusInternalServerError, "Serialization error"}
var AIError = &APIError{"server.ai_error", http.StatusInternalServerError, "AI generation failed"}
var AIUnavailable = &APIError{"server.ai_unavailable", http.StatusServiceUnavailable, "AI service unavailable"}
var UploadError = &APIError{"server.upload_error", http.StatusInternalServerError, "Failed to generate upload URL"}
