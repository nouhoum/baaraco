CREATE TABLE IF NOT EXISTS decision_memos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Section 1: Decision
    decision TEXT NOT NULL DEFAULT 'pending',

    -- Section 2: Post-interview evaluation per criterion
    post_interview_evaluations JSONB NOT NULL DEFAULT '[]',

    -- Section 3: Confirmed strengths
    confirmed_strengths JSONB NOT NULL DEFAULT '[]',

    -- Section 4: Identified risks with mitigation
    identified_risks JSONB NOT NULL DEFAULT '[]',

    -- Section 6: Justification
    justification TEXT NOT NULL DEFAULT '',

    -- Section 7: Next steps (conditional on decision)
    next_steps JSONB NOT NULL DEFAULT '{}',

    -- Status tracking
    status TEXT NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(job_id, candidate_id)
);

CREATE INDEX idx_decision_memos_job_candidate ON decision_memos(job_id, candidate_id);
CREATE INDEX idx_decision_memos_recruiter ON decision_memos(recruiter_id);
