package apierror

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestSend(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	NotAuthenticated.Send(c)

	assert.Equal(t, http.StatusUnauthorized, w.Code)

	var body map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &body)
	assert.NoError(t, err)
	assert.Equal(t, "auth.not_authenticated", body["code"])
	assert.Equal(t, "Not authenticated", body["error"])
}

func TestSendWithDetails(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	details := map[string]string{"email": "invalid format"}
	ValidationFailed.SendWithDetails(c, details)

	assert.Equal(t, http.StatusBadRequest, w.Code)

	var body map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &body)
	assert.NoError(t, err)
	assert.Equal(t, "validation.failed", body["code"])
	assert.Equal(t, "Validation failed", body["error"])
	detailsMap, ok := body["details"].(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, "invalid format", detailsMap["email"])
}

func TestAbort(t *testing.T) {
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)

	AccessDenied.Abort(c)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.True(t, c.IsAborted())

	var body map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &body)
	assert.NoError(t, err)
	assert.Equal(t, "auth.access_denied", body["code"])
	assert.Equal(t, "Access denied", body["error"])
}

func TestAllErrorsHaveValidStatusCodes(t *testing.T) {
	errors := []*APIError{
		NotAuthenticated, SessionInvalid, UserNotFound, AccountDisabled,
		AccessDenied, RoleRequired, OrgMismatch, InvalidToken,
		InvalidData, MissingField, InvalidEmail, InvalidStatus, InvalidRole, ValidationFailed,
		JobNotFound, CandidateNotFound, AttemptNotFound, EvaluationNotFound,
		ProofProfileNotFound, InterviewKitNotFound, DecisionMemoNotFound,
		ScorecardNotFound, WorkSampleNotFound, InviteNotFound,
		PilotRequestNotFound, FormatRequestNotFound, ResourceNotAvailable,
		AlreadySubmitted, NotEditable, AlreadyExists, InviteExpired,
		AlreadyConverted, NoScorecard, MissingRequiredFields,
		DecisionRequired, JustificationRequired, DuplicateRequest, NoContent, NoOrg,
		RecruiterCannotInvite, CandidateCannotInvite,
		UserAlreadyRecruiter, UserIsAdmin, DuplicateAttempt,
		InvalidName, InvalidProgress, InvalidFormat, InvalidReason, AlreadyProcessed,
		InternalError, FetchError, CreateError, UpdateError, DeleteError,
		SessionError, SerializationError, AIError, AIUnavailable, UploadError,
	}

	for _, e := range errors {
		assert.NotEmpty(t, e.Code, "error code should not be empty")
		assert.NotEmpty(t, e.Fallback, "fallback message should not be empty")
		assert.True(t, e.StatusCode >= 400 && e.StatusCode < 600, "status code %d for %s should be 4xx or 5xx", e.StatusCode, e.Code)
	}
}
