-- Add unique partial index to prevent duplicate active attempts per candidate/role
-- This allows only ONE draft/in_progress/interviewing attempt per candidate per role_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_attempt_per_role
ON work_sample_attempts (candidate_id, role_type)
WHERE status IN ('draft', 'in_progress', 'interviewing');
