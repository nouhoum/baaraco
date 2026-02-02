DROP TRIGGER IF EXISTS update_interview_sessions_updated_at ON interview_sessions;
DROP TABLE IF EXISTS interview_sessions;
ALTER TABLE work_sample_attempts DROP COLUMN IF EXISTS interview_mode;
