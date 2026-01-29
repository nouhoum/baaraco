-- Add shortlisted and rejected statuses to work_sample_attempts
-- Also add rejection_reason field for recruiter notes

ALTER TABLE work_sample_attempts
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update the status check constraint to include new statuses
-- PostgreSQL: we need to drop and recreate the constraint
-- Note: If there's no explicit CHECK constraint (using GORM varchar), this is just documentation
-- The application-level validation handles the status values
