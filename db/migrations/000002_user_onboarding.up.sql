-- Add onboarding fields to users table
-- These fields are collected during the onboarding flow for candidates

-- Role type the candidate is looking for
ALTER TABLE users ADD COLUMN role_type VARCHAR(50);

-- Optional profile links
ALTER TABLE users ADD COLUMN linkedin_url VARCHAR(500);
ALTER TABLE users ADD COLUMN github_username VARCHAR(100);

-- Onboarding completion timestamp (NULL = not completed)
ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

-- Index for filtering users by role type
CREATE INDEX idx_users_role_type ON users(role_type);

-- Comment on columns
COMMENT ON COLUMN users.role_type IS 'Desired job role: backend_go, infra_platform, sre, other';
COMMENT ON COLUMN users.onboarding_completed_at IS 'When user completed onboarding wizard (NULL = not done)';
