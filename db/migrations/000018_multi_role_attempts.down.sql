DROP INDEX IF EXISTS idx_wsa_candidate_role;
ALTER TABLE work_sample_attempts DROP COLUMN IF EXISTS role_type;
