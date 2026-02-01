-- Education: JSONB array of {institution, degree, field, start_year, end_year}
ALTER TABLE users ADD COLUMN education JSONB DEFAULT '[]';

-- Certifications: JSONB array of {name, issuer, year}
ALTER TABLE users ADD COLUMN certifications JSONB DEFAULT '[]';

-- Languages: JSONB array of {language, level}
ALTER TABLE users ADD COLUMN languages JSONB DEFAULT '[]';

-- Website / portfolio URL
ALTER TABLE users ADD COLUMN website_url TEXT;

-- Availability: immediate, 1_month, 3_months, 6_months, not_looking
ALTER TABLE users ADD COLUMN availability VARCHAR(50);

-- Remote preference: remote, hybrid, onsite
ALTER TABLE users ADD COLUMN remote_preference VARCHAR(50);

-- Open to relocation
ALTER TABLE users ADD COLUMN open_to_relocation BOOLEAN DEFAULT false;
