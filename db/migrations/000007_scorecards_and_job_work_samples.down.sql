-- Drop triggers
DROP TRIGGER IF EXISTS update_job_work_samples_updated_at ON job_work_samples;
DROP TRIGGER IF EXISTS update_scorecards_updated_at ON scorecards;

-- Drop indexes
DROP INDEX IF EXISTS idx_job_work_samples_scorecard_id;
DROP INDEX IF EXISTS idx_job_work_samples_job_id;
DROP INDEX IF EXISTS idx_scorecards_job_id;

-- Drop tables
DROP TABLE IF EXISTS job_work_samples;
DROP TABLE IF EXISTS scorecards;
