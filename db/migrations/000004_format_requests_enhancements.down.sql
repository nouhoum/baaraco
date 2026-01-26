-- Remove added columns
DROP INDEX IF EXISTS idx_format_requests_candidate_id;
ALTER TABLE format_requests DROP COLUMN IF EXISTS response_message;
ALTER TABLE format_requests DROP COLUMN IF EXISTS candidate_id;
