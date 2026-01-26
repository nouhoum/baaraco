-- Drop triggers
DROP TRIGGER IF EXISTS update_format_requests_updated_at ON format_requests;
DROP TRIGGER IF EXISTS update_work_sample_attempts_updated_at ON work_sample_attempts;

-- Drop tables
DROP TABLE IF EXISTS format_requests;
DROP TABLE IF EXISTS work_sample_attempts;
