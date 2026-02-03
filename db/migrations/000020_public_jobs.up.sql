-- Add is_public flag to jobs (opt-in by recruiter when publishing)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;

-- Add slug for SEO-friendly public URLs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS slug VARCHAR(200);

-- Index for public job listings (only active + public jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_public_active
  ON jobs(is_public, status)
  WHERE is_public = TRUE AND status = 'active';

-- Unique index on slug for public URL lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_slug
  ON jobs(slug)
  WHERE slug IS NOT NULL;
