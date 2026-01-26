-- Rollback admin tracking fields from pilot_requests table

DROP INDEX IF EXISTS idx_pilot_requests_admin_status;

ALTER TABLE pilot_requests DROP COLUMN IF EXISTS converted_at;
ALTER TABLE pilot_requests DROP COLUMN IF EXISTS converted_user_id;
ALTER TABLE pilot_requests DROP COLUMN IF EXISTS notes;
ALTER TABLE pilot_requests DROP COLUMN IF EXISTS admin_status;
