-- Baara MVP Schema
-- Complete data model with auth system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- ORGANIZATIONS
-- Companies using Baara for hiring
-- =============================================================================
CREATE TABLE orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE,
    plan VARCHAR(50) DEFAULT 'pilot',  -- pilot, starter, pro
    logo_url VARCHAR(500),
    website VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_orgs_slug ON orgs(slug);
CREATE INDEX idx_orgs_deleted_at ON orgs(deleted_at);

CREATE TRIGGER update_orgs_updated_at
    BEFORE UPDATE ON orgs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- USERS
-- All authenticated users: candidates, recruiters, admins
-- =============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(200),
    avatar_url VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'candidate',  -- candidate, recruiter, admin
    org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,  -- NULL for candidates
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, active, disabled
    locale VARCHAR(10) DEFAULT 'fr',
    email_verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org ON users(org_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- IDENTITIES
-- Auth providers (extensible for OAuth/SSO)
-- =============================================================================
CREATE TABLE identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,  -- magiclink, google, github, oidc:tenant
    provider_subject VARCHAR(255),  -- ID from provider (NULL for magiclink)
    email VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider, provider_subject) -- Only for non-magiclink providers
);

CREATE INDEX idx_identities_user ON identities(user_id);
CREATE INDEX idx_identities_provider ON identities(provider);
CREATE INDEX idx_identities_email ON identities(email);

CREATE TRIGGER update_identities_updated_at
    BEFORE UPDATE ON identities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SESSIONS
-- User sessions for authentication
-- =============================================================================
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,  -- SHA256 hex of token
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,  -- NULL if active
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =============================================================================
-- LOGIN TOKENS
-- Magic link tokens for passwordless auth
-- =============================================================================
CREATE TABLE login_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,  -- SHA256 hex of token
    is_new_user BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,  -- NULL if not yet used
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_login_tokens_email ON login_tokens(email);
CREATE INDEX idx_login_tokens_token ON login_tokens(token_hash);
CREATE INDEX idx_login_tokens_expires ON login_tokens(expires_at);

-- =============================================================================
-- JOBS
-- Job positions for hiring
-- =============================================================================
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    role_type VARCHAR(50),  -- backend_go, infra_platform, sre, etc.
    status VARCHAR(20) DEFAULT 'draft',  -- draft, active, paused, closed
    work_sample_id UUID,  -- Reference to work sample template (future)
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_jobs_org ON jobs(org_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_deleted_at ON jobs(deleted_at);

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- INVITES
-- Invitations for recruiters and candidates
-- =============================================================================
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,  -- NULL for standalone candidate invites
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- recruiter, candidate
    invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,  -- For candidate invites
    token_hash VARCHAR(64) NOT NULL,  -- SHA256 hex of token
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,  -- NULL if not yet accepted
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invites_email ON invites(email);
CREATE INDEX idx_invites_token ON invites(token_hash);
CREATE INDEX idx_invites_org ON invites(org_id);
CREATE INDEX idx_invites_expires ON invites(expires_at);

-- =============================================================================
-- CANDIDATE SIGNUPS (Pre-auth)
-- For candidates who sign up before authentication
-- Can be converted to users when they authenticate
-- =============================================================================
CREATE TABLE candidate_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    linkedin_url VARCHAR(500),
    portfolio_url VARCHAR(500),
    locale VARCHAR(10) DEFAULT 'fr',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, converted
    converted_user_id UUID REFERENCES users(id),  -- Set when converted to user
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_candidate_signups_email ON candidate_signups(email);
CREATE INDEX idx_candidate_signups_status ON candidate_signups(status);
CREATE INDEX idx_candidate_signups_deleted_at ON candidate_signups(deleted_at);

CREATE TRIGGER update_candidate_signups_updated_at
    BEFORE UPDATE ON candidate_signups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- PILOT REQUESTS
-- For recruiters requesting the pilot program
-- =============================================================================
CREATE TABLE pilot_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    role_to_hire VARCHAR(50) NOT NULL,
    locale VARCHAR(10) DEFAULT 'fr',
    role VARCHAR(50),
    team_size VARCHAR(20),
    hiring_timeline VARCHAR(20),
    website VARCHAR(500),
    production_context TEXT[],
    baseline_time_to_hire INTEGER,
    baseline_interviews INTEGER,
    baseline_pain_point TEXT,
    job_link VARCHAR(500),
    message TEXT,
    consent_given BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'partial',  -- partial, complete, approved, rejected
    completed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    converted_org_id UUID REFERENCES orgs(id),  -- Set when converted to org
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_pilot_requests_email ON pilot_requests(email);
CREATE INDEX idx_pilot_requests_status ON pilot_requests(status);
CREATE INDEX idx_pilot_requests_company ON pilot_requests(company);
CREATE INDEX idx_pilot_requests_deleted_at ON pilot_requests(deleted_at);

CREATE TRIGGER update_pilot_requests_updated_at
    BEFORE UPDATE ON pilot_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- WORK SAMPLES (for candidates to showcase their work)
-- =============================================================================
CREATE TABLE work_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    file_key VARCHAR(500),
    file_type VARCHAR(100),
    file_size BIGINT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_work_samples_user_id ON work_samples(user_id);
CREATE INDEX idx_work_samples_deleted_at ON work_samples(deleted_at);

CREATE TRIGGER update_work_samples_updated_at
    BEFORE UPDATE ON work_samples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
