const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export interface WaitlistResponse {
  success: boolean;
  message: string;
  id?: string;
}

export interface ErrorResponse {
  error: string;
  details?: Record<string, string>;
}

export async function registerRecruiter(data: {
  email: string;
  name: string;
  company: string;
  job_title?: string;
}): Promise<WaitlistResponse> {
  const response = await fetch(`${API_URL}/public/waitlist/recruiter`, {
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

export async function registerCandidate(data: {
  email: string;
  name: string;
  linkedin_url?: string;
  portfolio_url?: string;
}): Promise<WaitlistResponse> {
  const response = await fetch(`${API_URL}/public/waitlist/candidate`, {
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
