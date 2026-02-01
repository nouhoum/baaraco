-- M1.1: Add template support for jobs and public profiles

-- 1. Add is_template column to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_template BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Make org_id nullable (templates have no org)
ALTER TABLE jobs ALTER COLUMN org_id DROP NOT NULL;

-- 3. Add index for template lookups
CREATE INDEX IF NOT EXISTS idx_jobs_is_template ON jobs(is_template) WHERE is_template = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_role_type ON jobs(role_type);

-- 4. Add public profile fields to proof_profiles
ALTER TABLE proof_profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE proof_profiles ADD COLUMN IF NOT EXISTS public_slug VARCHAR(50) UNIQUE;

-- 5. Index for public profile lookups
CREATE INDEX IF NOT EXISTS idx_proof_profiles_public_slug ON proof_profiles(public_slug) WHERE public_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_proof_profiles_is_public ON proof_profiles(is_public) WHERE is_public = TRUE;

-- 6. Add role_type index on proof_profiles via job for percentile queries
CREATE INDEX IF NOT EXISTS idx_proof_profiles_candidate_score ON proof_profiles(candidate_id, global_score);
