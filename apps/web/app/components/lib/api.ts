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
