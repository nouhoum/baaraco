-- Add enriched profile fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS resume_original_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS years_of_experience INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_company VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_title VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);

-- Indexes for talent pool filtering
CREATE INDEX IF NOT EXISTS idx_users_role_type ON users(role_type);
CREATE INDEX IF NOT EXISTS idx_users_skills ON users USING GIN (skills);
