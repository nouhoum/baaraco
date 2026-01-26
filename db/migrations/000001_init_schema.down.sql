-- Drop triggers
DROP TRIGGER IF EXISTS update_work_samples_updated_at ON work_samples;
DROP TRIGGER IF EXISTS update_pilot_requests_updated_at ON pilot_requests;
DROP TRIGGER IF EXISTS update_candidate_signups_updated_at ON candidate_signups;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_identities_updated_at ON identities;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_orgs_updated_at ON orgs;

-- Drop tables (reverse order of creation due to foreign keys)
DROP TABLE IF EXISTS work_samples;
DROP TABLE IF EXISTS pilot_requests;
DROP TABLE IF EXISTS candidate_signups;
DROP TABLE IF EXISTS invites;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS login_tokens;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS identities;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orgs;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop extension
DROP EXTENSION IF EXISTS "pgcrypto";
