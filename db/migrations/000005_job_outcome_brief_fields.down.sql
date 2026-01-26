-- Rollback Outcome Brief fields from jobs table

-- Drop indexes
DROP INDEX IF EXISTS idx_jobs_location_type;
DROP INDEX IF EXISTS idx_jobs_contract_type;
DROP INDEX IF EXISTS idx_jobs_seniority;

-- Drop columns (in reverse order of creation)
ALTER TABLE jobs DROP COLUMN IF EXISTS urgency;
ALTER TABLE jobs DROP COLUMN IF EXISTS start_date;
ALTER TABLE jobs DROP COLUMN IF EXISTS salary_max;
ALTER TABLE jobs DROP COLUMN IF EXISTS salary_min;
ALTER TABLE jobs DROP COLUMN IF EXISTS failure_looks_like;
ALTER TABLE jobs DROP COLUMN IF EXISTS success_looks_like;
ALTER TABLE jobs DROP COLUMN IF EXISTS expected_outcomes;
ALTER TABLE jobs DROP COLUMN IF EXISTS main_problem;
ALTER TABLE jobs DROP COLUMN IF EXISTS business_context;
ALTER TABLE jobs DROP COLUMN IF EXISTS manager_info;
ALTER TABLE jobs DROP COLUMN IF EXISTS team_size;
ALTER TABLE jobs DROP COLUMN IF EXISTS stack;
ALTER TABLE jobs DROP COLUMN IF EXISTS seniority;
ALTER TABLE jobs DROP COLUMN IF EXISTS contract_type;
ALTER TABLE jobs DROP COLUMN IF EXISTS location_city;
ALTER TABLE jobs DROP COLUMN IF EXISTS location_type;
ALTER TABLE jobs DROP COLUMN IF EXISTS team;
