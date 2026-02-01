-- Add experiences JSONB array to users
-- Each entry: {title, company, start_year, end_year, description}
ALTER TABLE users ADD COLUMN experiences JSONB DEFAULT '[]';
