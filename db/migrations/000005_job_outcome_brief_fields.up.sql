-- Add Outcome Brief fields to jobs table

-- Section 1: Le poste
ALTER TABLE jobs ADD COLUMN team VARCHAR(200);
ALTER TABLE jobs ADD COLUMN location_type VARCHAR(20);
ALTER TABLE jobs ADD COLUMN location_city VARCHAR(200);
ALTER TABLE jobs ADD COLUMN contract_type VARCHAR(20);
ALTER TABLE jobs ADD COLUMN seniority VARCHAR(20);

-- Section 2: Le contexte
ALTER TABLE jobs ADD COLUMN stack JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN team_size VARCHAR(10);
ALTER TABLE jobs ADD COLUMN manager_info TEXT;
ALTER TABLE jobs ADD COLUMN business_context TEXT;

-- Section 3: Les outcomes
ALTER TABLE jobs ADD COLUMN main_problem TEXT;
ALTER TABLE jobs ADD COLUMN expected_outcomes JSONB DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN success_looks_like TEXT;
ALTER TABLE jobs ADD COLUMN failure_looks_like TEXT;

-- Section 4: Logistique
ALTER TABLE jobs ADD COLUMN salary_min INTEGER;
ALTER TABLE jobs ADD COLUMN salary_max INTEGER;
ALTER TABLE jobs ADD COLUMN start_date DATE;
ALTER TABLE jobs ADD COLUMN urgency VARCHAR(20);

-- Index for common filters
CREATE INDEX idx_jobs_location_type ON jobs(location_type);
CREATE INDEX idx_jobs_contract_type ON jobs(contract_type);
CREATE INDEX idx_jobs_seniority ON jobs(seniority);
