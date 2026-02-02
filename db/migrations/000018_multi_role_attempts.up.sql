-- Add role_type directly to work_sample_attempts for efficient querying
ALTER TABLE work_sample_attempts ADD COLUMN role_type VARCHAR(50);

-- Backfill role_type from linked job
UPDATE work_sample_attempts wsa
SET role_type = j.role_type
FROM jobs j
WHERE wsa.job_id = j.id AND wsa.role_type IS NULL;

-- Backfill role_type from user's role_type for legacy attempts with no job
UPDATE work_sample_attempts wsa
SET role_type = u.role_type
FROM users u
WHERE wsa.candidate_id = u.id
  AND wsa.job_id IS NULL
  AND wsa.role_type IS NULL
  AND u.role_type IS NOT NULL
  AND u.role_type != '';

-- Index for the common query pattern: find all attempts for a candidate by role
CREATE INDEX idx_wsa_candidate_role ON work_sample_attempts(candidate_id, role_type);
