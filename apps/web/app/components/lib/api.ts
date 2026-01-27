const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface ErrorResponse {
  error: string;
  details?: Record<string, string>;
}

// =============================================================================
// CANDIDATE SIGNUPS
// =============================================================================

export interface CandidateSignupRequest {
  email: string;
  name: string;
  linkedin_url?: string;
  portfolio_url?: string;
  locale?: string;
}

export interface CandidateSignupResponse {
  success: boolean;
  message: string;
  id?: string;
}

export async function registerCandidate(data: CandidateSignupRequest): Promise<CandidateSignupResponse> {
  const response = await fetch(`${API_URL}/api/v1/candidate-signups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// PILOT REQUESTS (Recruiters)
// =============================================================================

export interface PilotRequestStep1 {
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  role_to_hire: string;
  locale?: string;
}

export interface PilotRequestStep2 {
  role: string;
  team_size: string;
  hiring_timeline: string;
  website?: string;
  production_context?: string[];
  baseline_time_to_hire?: number;
  baseline_interviews?: number;
  baseline_pain_point?: string;
  job_link?: string;
  message?: string;
  consent_given: boolean;
}

export interface PilotRequestResponse {
  id: string;
  status: "partial" | "complete";
  message: string;
}

// Create a pilot request (Step 1)
export async function createPilotRequest(data: PilotRequestStep1): Promise<PilotRequestResponse> {
  const response = await fetch(`${API_URL}/api/v1/pilot-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Complete a pilot request (Step 2)
export async function completePilotRequest(id: string, data: PilotRequestStep2): Promise<PilotRequestResponse> {
  const response = await fetch(`${API_URL}/api/v1/pilot-requests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// AUTHENTICATION
// =============================================================================

export type RoleType = "backend_go" | "infra_platform" | "sre" | "other";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: "admin" | "recruiter" | "candidate";
  status: "pending" | "active" | "disabled";
  org?: {
    id: string;
    name: string;
    slug?: string;
  };
  role_type?: RoleType;
  linkedin_url?: string;
  github_username?: string;
  onboarding_completed_at?: string;
}

export interface AuthStartRequest {
  email: string;
  locale?: string;
}

export interface AuthStartResponse {
  success: boolean;
  message: string;
}

export interface AuthExchangeRequest {
  token: string;
}

export interface AuthExchangeResponse {
  success: boolean;
  user: User;
}

export interface AuthMeResponse {
  user: User;
}

// Start magic link flow (send email)
export async function authStart(data: AuthStartRequest): Promise<AuthStartResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Exchange magic link token for session
export async function authExchange(data: AuthExchangeRequest): Promise<AuthExchangeResponse> {
  const response = await fetch(`${API_URL}/api/v1/auth/exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Logout (revoke session)
export async function authLogout(): Promise<void> {
  await fetch(`${API_URL}/api/v1/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

// Get current user
export async function authMe(): Promise<AuthMeResponse | null> {
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// =============================================================================
// INVITES
// =============================================================================

export interface InviteInfo {
  email: string;
  role: string;
  org_name?: string;
  job_title?: string;
  valid: boolean;
}

export interface AcceptInviteRequest {
  name: string;
}

export interface AcceptInviteResponse {
  success: boolean;
  user: User;
}

// Get invite info (public)
export async function getInviteInfo(token: string): Promise<InviteInfo> {
  const response = await fetch(`${API_URL}/api/v1/invites/${token}`);

  if (!response.ok) {
    return { email: "", role: "", valid: false };
  }

  return response.json();
}

// Accept invite
export async function acceptInvite(token: string, data: AcceptInviteRequest): Promise<AcceptInviteResponse> {
  const response = await fetch(`${API_URL}/api/v1/invites/${token}/accept`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// USER PROFILE
// =============================================================================

export interface UpdateProfileRequest {
  name?: string;
  role_type?: RoleType;
  linkedin_url?: string;
  github_username?: string;
  locale?: string;
}

export interface CompleteOnboardingRequest {
  name: string;
  role_type: RoleType;
  linkedin_url?: string;
  github_username?: string;
}

export interface UserResponse {
  user: User;
}

// Get current user profile
export async function getUserProfile(): Promise<UserResponse> {
  const response = await fetch(`${API_URL}/api/v1/users/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Update user profile
export async function updateProfile(data: UpdateProfileRequest): Promise<UserResponse> {
  const response = await fetch(`${API_URL}/api/v1/users/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Complete onboarding
export async function completeOnboarding(data: CompleteOnboardingRequest): Promise<UserResponse> {
  const response = await fetch(`${API_URL}/api/v1/users/me/onboarding`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// WORK SAMPLE ATTEMPTS
// =============================================================================

export type AttemptStatus = "draft" | "in_progress" | "submitted" | "reviewed";

export interface WorkSampleAttempt {
  id: string;
  candidate_id: string;
  job_id?: string;
  status: AttemptStatus;
  answers: Record<string, string>;
  progress: number;
  last_saved_at?: string;
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export type FormatRequestReason = "oral" | "more_time" | "accessibility" | "other";
export type FormatRequestPreference = "video_call" | "google_docs" | "multi_step" | "other";
export type FormatRequestStatus = "pending" | "approved" | "denied";

export interface FormatRequest {
  id: string;
  attempt_id: string;
  reason: FormatRequestReason;
  preferred_format: FormatRequestPreference;
  comment?: string;
  status: FormatRequestStatus;
  created_at: string;
}

export interface GetMyAttemptResponse {
  attempt: WorkSampleAttempt;
  format_request?: FormatRequest;
}

export interface SaveAttemptRequest {
  answers: Record<string, string>;
  progress: number;
}

export interface SaveAttemptResponse {
  attempt: WorkSampleAttempt;
  message: string;
}

export interface SubmitAttemptResponse {
  attempt: WorkSampleAttempt;
  message: string;
}

export interface FormatRequestCreateRequest {
  reason: FormatRequestReason;
  preferred_format: FormatRequestPreference;
  comment?: string;
}

export interface FormatRequestResponse {
  format_request: FormatRequest;
  message: string;
}

// Get current user's work sample attempt (creates one if doesn't exist)
export async function getMyWorkSampleAttempt(): Promise<GetMyAttemptResponse> {
  const response = await fetch(`${API_URL}/api/v1/work-sample-attempts/me`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Save work sample attempt progress
export async function saveWorkSampleAttempt(
  attemptId: string,
  data: SaveAttemptRequest
): Promise<SaveAttemptResponse> {
  const response = await fetch(`${API_URL}/api/v1/work-sample-attempts/${attemptId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Submit work sample attempt
export async function submitWorkSampleAttempt(attemptId: string): Promise<SubmitAttemptResponse> {
  const response = await fetch(`${API_URL}/api/v1/work-sample-attempts/${attemptId}/submit`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Request alternative format
export async function requestAlternativeFormat(
  attemptId: string,
  data: FormatRequestCreateRequest
): Promise<FormatRequestResponse> {
  const response = await fetch(`${API_URL}/api/v1/work-sample-attempts/${attemptId}/format-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// FORMAT REQUESTS MANAGEMENT (For recruiters/admins)
// =============================================================================

export interface FormatRequestDetail {
  id: string;
  attempt_id: string;
  reason: FormatRequestReason;
  preferred_format: FormatRequestPreference;
  comment?: string;
  status: FormatRequestStatus;
  response_message?: string;
  reviewed_at?: string;
  reviewed_by?: User;
  candidate?: User;
  created_at: string;
  updated_at: string;
}

export interface ListFormatRequestsResponse {
  format_requests: FormatRequestDetail[];
  total: number;
}

export interface RespondToFormatRequestRequest {
  status: "approved" | "denied";
  response_message: string;
}

export interface RespondToFormatRequestResponse {
  format_request: FormatRequestDetail;
  message: string;
}

export interface PendingCountResponse {
  pending_count: number;
}

// List all format requests (for recruiters/admins)
export async function listFormatRequests(status?: string): Promise<ListFormatRequestsResponse> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);

  const url = `${API_URL}/api/v1/format-requests${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Get a specific format request
export async function getFormatRequest(id: string): Promise<{ format_request: FormatRequestDetail }> {
  const response = await fetch(`${API_URL}/api/v1/format-requests/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Respond to a format request (approve/deny)
export async function respondToFormatRequest(
  id: string,
  data: RespondToFormatRequestRequest
): Promise<RespondToFormatRequestResponse> {
  const response = await fetch(`${API_URL}/api/v1/format-requests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Get count of pending format requests
export async function getPendingFormatRequestsCount(): Promise<PendingCountResponse> {
  const response = await fetch(`${API_URL}/api/v1/format-requests/pending-count`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// JOBS
// =============================================================================

export type JobStatus = "draft" | "active" | "paused" | "closed";
export type LocationType = "remote" | "hybrid" | "onsite";
export type ContractType = "cdi" | "cdd" | "freelance";
export type SeniorityLevel = "junior" | "mid" | "senior" | "staff" | "principal";
export type TeamSize = "1-3" | "4-8" | "9-15" | "16+";
export type Urgency = "immediate" | "1-2months" | "flexible";

export interface Job {
  id: string;
  org_id: string;
  status: JobStatus;

  // Section 1: Le poste
  title: string;
  team?: string;
  location_type?: LocationType;
  location_city?: string;
  contract_type?: ContractType;
  seniority?: SeniorityLevel;

  // Section 2: Le contexte
  stack?: string[];
  team_size?: TeamSize;
  manager_info?: string;
  business_context?: string;

  // Section 3: Les outcomes
  main_problem?: string;
  expected_outcomes?: string[];
  success_looks_like?: string;
  failure_looks_like?: string;

  // Section 4: Logistique
  salary_min?: number;
  salary_max?: number;
  start_date?: string;
  urgency?: Urgency;

  // Metadata
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface JobListItem {
  id: string;
  title: string;
  team?: string;
  status: JobStatus;
  location_type?: LocationType;
  seniority?: SeniorityLevel;
  created_at: string;
  updated_at: string;
}

export interface CreateJobRequest {
  title: string;
  team?: string;
  location_type?: LocationType;
  location_city?: string;
  contract_type?: ContractType;
  seniority?: SeniorityLevel;
  stack?: string[];
  team_size?: TeamSize;
  manager_info?: string;
  business_context?: string;
  main_problem?: string;
  expected_outcomes?: string[];
  success_looks_like?: string;
  failure_looks_like?: string;
  salary_min?: number;
  salary_max?: number;
  start_date?: string;
  urgency?: Urgency;
}

export interface UpdateJobRequest {
  title?: string;
  team?: string;
  location_type?: LocationType;
  location_city?: string;
  contract_type?: ContractType;
  seniority?: SeniorityLevel;
  stack?: string[];
  team_size?: TeamSize;
  manager_info?: string;
  business_context?: string;
  main_problem?: string;
  expected_outcomes?: string[];
  success_looks_like?: string;
  failure_looks_like?: string;
  salary_min?: number;
  salary_max?: number;
  start_date?: string;
  urgency?: Urgency;
}

export interface JobResponse {
  job: Job;
  message?: string;
}

export interface JobListResponse {
  jobs: JobListItem[];
  total: number;
}

// List all jobs for the current org
export async function listJobs(status?: JobStatus): Promise<JobListResponse> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);

  const url = `${API_URL}/api/v1/jobs${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Get a specific job
export async function getJob(id: string): Promise<JobResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Create a new job
export async function createJob(data: CreateJobRequest): Promise<JobResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Update a job
export async function updateJob(id: string, data: UpdateJobRequest): Promise<JobResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Delete a job
export async function deleteJob(id: string): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Publish a job
export async function publishJob(id: string): Promise<JobResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${id}/publish`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Pause a job
export async function pauseJob(id: string): Promise<JobResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${id}/pause`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Close a job
export async function closeJob(id: string): Promise<JobResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${id}/close`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// SCORECARDS
// =============================================================================

export type CriterionWeight = "critical" | "important" | "nice_to_have";

export interface ScorecardCriterion {
  name: string;
  description: string;
  weight: CriterionWeight;
  positive_signals: string[];
  negative_signals: string[];
  red_flags: string[];
}

export interface Scorecard {
  id: string;
  job_id: string;
  criteria: ScorecardCriterion[];
  generated_at?: string;
  prompt_version?: string;
  created_at: string;
  updated_at: string;
}

export interface ScorecardResponse {
  scorecard: Scorecard;
  message?: string;
}

// Generate scorecard for a job
export async function generateScorecard(jobId: string): Promise<ScorecardResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/generate-scorecard`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Get scorecard for a job
export async function getScorecard(jobId: string): Promise<ScorecardResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/scorecard`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Update scorecard for a job
export async function updateScorecard(jobId: string, criteria: ScorecardCriterion[]): Promise<ScorecardResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/scorecard`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ criteria }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// JOB WORK SAMPLES
// =============================================================================

export interface WorkSampleSection {
  title: string;
  description: string;
  instructions: string;
  estimated_time_minutes: number;
  criteria_evaluated: string[];
  rubric: string;
}

export interface JobWorkSample {
  id: string;
  job_id: string;
  scorecard_id?: string;
  intro_message: string;
  rules: string[];
  sections: WorkSampleSection[];
  estimated_time_minutes?: number;
  generated_at?: string;
  prompt_version?: string;
  created_at: string;
  updated_at: string;
}

export interface JobWorkSampleResponse {
  work_sample: JobWorkSample;
  message?: string;
}

// Generate work sample for a job
export async function generateWorkSample(jobId: string): Promise<JobWorkSampleResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/generate-work-sample`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Get work sample for a job
export async function getWorkSample(jobId: string): Promise<JobWorkSampleResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/work-sample`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Update work sample for a job
export async function updateWorkSample(
  jobId: string,
  data: { intro_message?: string; rules?: string[]; sections: WorkSampleSection[] }
): Promise<JobWorkSampleResponse> {
  const response = await fetch(`${API_URL}/api/v1/jobs/${jobId}/work-sample`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// =============================================================================
// ADMIN - PILOT REQUESTS
// =============================================================================

export type AdminStatus = "new" | "contacted" | "in_discussion" | "converted" | "rejected" | "archived";

export interface PilotNote {
  content: string;
  created_by: string;
  author_name?: string;
  created_at: string;
}

export interface PilotRequest {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  role_to_hire: string;
  locale: string;
  role?: string;
  team_size?: string;
  hiring_timeline?: string;
  website?: string;
  production_context?: string[];
  baseline_time_to_hire?: number;
  baseline_interviews?: number;
  baseline_pain_point?: string;
  job_link?: string;
  message?: string;
  status: "partial" | "complete";
  admin_status: AdminStatus;
  notes: PilotNote[];
  converted_user_id?: string;
  converted_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PilotRequestListItem {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company: string;
  role_to_hire: string;
  admin_status: AdminStatus;
  created_at: string;
}

export interface PilotRequestStats {
  new: number;
  contacted: number;
  in_discussion: number;
  converted: number;
  rejected: number;
  total: number;
}

export interface PilotRequestListResponse {
  requests: PilotRequestListItem[];
  total: number;
  page: number;
  per_page: number;
  stats: PilotRequestStats;
}

export interface AdminPilotRequestResponse {
  request: PilotRequest;
  message?: string;
}

export interface ConvertResponse {
  user_id?: string;
  org_id: string;
  invite_id?: string;
  message: string;
}

// List pilot requests (admin only)
export async function listPilotRequests(params?: {
  status?: AdminStatus | "all";
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<PilotRequestListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status && params.status !== "all") searchParams.append("status", params.status);
  if (params?.search) searchParams.append("search", params.search);
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.per_page) searchParams.append("per_page", params.per_page.toString());

  const url = `${API_URL}/api/v1/admin/pilot-requests${searchParams.toString() ? `?${searchParams}` : ""}`;
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Get a single pilot request (admin only)
export async function getPilotRequest(id: string): Promise<AdminPilotRequestResponse> {
  const response = await fetch(`${API_URL}/api/v1/admin/pilot-requests/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Update pilot request status (admin only)
export async function updatePilotRequestStatus(
  id: string,
  adminStatus: AdminStatus
): Promise<AdminPilotRequestResponse> {
  const response = await fetch(`${API_URL}/api/v1/admin/pilot-requests/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ admin_status: adminStatus }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Add note to pilot request (admin only)
export async function addPilotRequestNote(
  id: string,
  content: string
): Promise<AdminPilotRequestResponse> {
  const response = await fetch(`${API_URL}/api/v1/admin/pilot-requests/${id}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}

// Convert pilot request to recruiter account (admin only)
export async function convertPilotRequest(
  id: string,
  options?: { org_name?: string; send_invitation?: boolean }
): Promise<ConvertResponse> {
  const response = await fetch(`${API_URL}/api/v1/admin/pilot-requests/${id}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(options || { send_invitation: true }),
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.error || "Une erreur est survenue");
  }

  return response.json();
}
