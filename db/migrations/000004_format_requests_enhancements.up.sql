-- Add candidate_id for easier querying (denormalized from attempt)
ALTER TABLE format_requests ADD COLUMN candidate_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Add response_message (rename from review_note for clarity, but keep review_note for compatibility)
ALTER TABLE format_requests ADD COLUMN response_message TEXT;

-- Index for filtering by candidate
CREATE INDEX idx_format_requests_candidate_id ON format_requests(candidate_id);

-- Backfill candidate_id from existing attempts
UPDATE format_requests fr
SET candidate_id = wsa.candidate_id
FROM work_sample_attempts wsa
WHERE fr.attempt_id = wsa.id
AND fr.candidate_id IS NULL;
