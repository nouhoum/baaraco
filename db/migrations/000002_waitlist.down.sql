-- Drop triggers
DROP TRIGGER IF EXISTS update_work_samples_updated_at ON work_samples;
DROP TRIGGER IF EXISTS update_waitlist_entries_updated_at ON waitlist_entries;

-- Drop tables
DROP TABLE IF EXISTS work_samples;
DROP TABLE IF EXISTS waitlist_entries;
