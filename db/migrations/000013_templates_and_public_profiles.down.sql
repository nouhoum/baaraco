-- Rollback M1.1: Remove template support and public profiles

DROP INDEX IF EXISTS idx_proof_profiles_candidate_score;
DROP INDEX IF EXISTS idx_proof_profiles_is_public;
DROP INDEX IF EXISTS idx_proof_profiles_public_slug;

ALTER TABLE proof_profiles DROP COLUMN IF EXISTS public_slug;
ALTER TABLE proof_profiles DROP COLUMN IF EXISTS is_public;

DROP INDEX IF EXISTS idx_jobs_role_type;
DROP INDEX IF EXISTS idx_jobs_is_template;

ALTER TABLE jobs ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE jobs DROP COLUMN IF EXISTS is_template;
