-- Add admin tracking fields to pilot_requests table

-- Admin status for tracking pilot request progress
ALTER TABLE pilot_requests ADD COLUMN admin_status VARCHAR(20) DEFAULT 'new';

-- Notes for internal tracking (JSONB array)
ALTER TABLE pilot_requests ADD COLUMN notes JSONB DEFAULT '[]';

-- Link to converted user
ALTER TABLE pilot_requests ADD COLUMN converted_user_id UUID REFERENCES users(id);
ALTER TABLE pilot_requests ADD COLUMN converted_at TIMESTAMPTZ;

-- Index for admin queries
CREATE INDEX idx_pilot_requests_admin_status ON pilot_requests(admin_status);

-- Update existing completed requests to have 'new' admin status
UPDATE pilot_requests
SET admin_status = 'new'
WHERE status = 'complete' AND admin_status IS NULL;

-- Update partial requests to 'archived' (they didn't complete the form)
UPDATE pilot_requests
SET admin_status = 'archived'
WHERE status = 'partial' AND admin_status IS NULL;
