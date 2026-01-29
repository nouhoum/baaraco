-- Proof Profiles table: stores formatted profiles generated from evaluations
CREATE TABLE IF NOT EXISTS proof_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES work_sample_attempts(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Summary
    global_score INT NOT NULL DEFAULT 0 CHECK (global_score >= 0 AND global_score <= 100),
    score_label VARCHAR(30) NOT NULL DEFAULT 'insuffisant',
    percentile INT NOT NULL DEFAULT 0 CHECK (percentile >= 0 AND percentile <= 100),
    recommendation VARCHAR(30) NOT NULL CHECK (recommendation IN ('proceed_to_interview', 'maybe', 'reject')),
    one_liner TEXT,

    -- Criteria summary as JSONB array
    -- Each: { name, score, weight, status, headline }
    criteria_summary JSONB NOT NULL DEFAULT '[]',

    -- Strengths with evidence as JSONB array
    -- Each: { criterion_name, score, signals[], evidence }
    strengths JSONB NOT NULL DEFAULT '[]',

    -- Areas to explore with suggested questions as JSONB array
    -- Each: { criterion_name, score, concerns[], suggested_questions[] }
    areas_to_explore JSONB NOT NULL DEFAULT '[]',

    -- Red flags as JSONB array
    -- Each: { criterion_name, flags[] }
    red_flags JSONB NOT NULL DEFAULT '[]',

    -- Interview focus points as JSONB array
    -- Each: { topic, reason, type }
    interview_focus_points JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    generated_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- One proof profile per evaluation
    UNIQUE(evaluation_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proof_profiles_evaluation_id ON proof_profiles(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_proof_profiles_attempt_id ON proof_profiles(attempt_id);
CREATE INDEX IF NOT EXISTS idx_proof_profiles_job_id ON proof_profiles(job_id);
CREATE INDEX IF NOT EXISTS idx_proof_profiles_candidate_id ON proof_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_proof_profiles_global_score ON proof_profiles(global_score);

-- Trigger for updated_at
CREATE TRIGGER update_proof_profiles_updated_at
    BEFORE UPDATE ON proof_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
