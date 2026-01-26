-- Rollback onboarding fields from users table

DROP INDEX IF EXISTS idx_users_role_type;

ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed_at;
ALTER TABLE users DROP COLUMN IF EXISTS github_username;
ALTER TABLE users DROP COLUMN IF EXISTS linkedin_url;
ALTER TABLE users DROP COLUMN IF EXISTS role_type;
