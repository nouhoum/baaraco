-- Work Sample Attempts table
-- Tracks a candidate's progress and answers on a work sample
CREATE TABLE work_sample_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    answers JSONB NOT NULL DEFAULT '{}',
    progress INTEGER NOT NULL DEFAULT 0,
    last_saved_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_status CHECK (status IN ('draft', 'in_progress', 'submitted', 'reviewed')),
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- Indexes for work_sample_attempts
CREATE INDEX idx_work_sample_attempts_candidate_id ON work_sample_attempts(candidate_id);
CREATE INDEX idx_work_sample_attempts_job_id ON work_sample_attempts(job_id);
CREATE INDEX idx_work_sample_attempts_status ON work_sample_attempts(status);
CREATE INDEX idx_work_sample_attempts_deleted_at ON work_sample_attempts(deleted_at);

-- Auto-update updated_at
CREATE TRIGGER update_work_sample_attempts_updated_at
    BEFORE UPDATE ON work_sample_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Format Requests table
-- Tracks requests from candidates for alternative work sample formats
CREATE TABLE format_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES work_sample_attempts(id) ON DELETE CASCADE,
    reason VARCHAR(30) NOT NULL,
    preferred_format VARCHAR(30) NOT NULL,
    comment TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT valid_reason CHECK (reason IN ('oral', 'more_time', 'accessibility', 'other')),
    CONSTRAINT valid_preferred_format CHECK (preferred_format IN ('video_call', 'google_docs', 'multi_step', 'other')),
    CONSTRAINT valid_request_status CHECK (status IN ('pending', 'approved', 'denied'))
);

-- Indexes for format_requests
CREATE INDEX idx_format_requests_attempt_id ON format_requests(attempt_id);
CREATE INDEX idx_format_requests_status ON format_requests(status);
CREATE INDEX idx_format_requests_deleted_at ON format_requests(deleted_at);

-- Auto-update updated_at
CREATE TRIGGER update_format_requests_updated_at
    BEFORE UPDATE ON format_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
