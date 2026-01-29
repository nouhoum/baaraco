-- Evaluations table: stores AI-generated evaluations of work sample attempts
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES work_sample_attempts(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Global score (weighted average of all criteria)
    global_score INT NOT NULL DEFAULT 0 CHECK (global_score >= 0 AND global_score <= 100),

    -- Criteria evaluations stored as JSONB array
    -- Each evaluation: { criterion_name, criterion_weight, score, confidence, positive_signals[],
    --                    negative_signals[], red_flags[], quotes[], assessment, criterion_covered }
    criteria_evaluations JSONB NOT NULL DEFAULT '[]',

    -- Final recommendation
    recommendation VARCHAR(30) NOT NULL CHECK (recommendation IN ('proceed_to_interview', 'maybe', 'reject')),
    recommendation_reason TEXT,

    -- Zones d'ombre: criteria that couldn't be properly evaluated
    uncovered_criteria JSONB DEFAULT '[]',

    -- Generation metadata
    prompt_version VARCHAR(50),
    generated_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- One evaluation per attempt
    UNIQUE(attempt_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_attempt_id ON evaluations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_job_id ON evaluations(job_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_candidate_id ON evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_global_score ON evaluations(global_score);
CREATE INDEX IF NOT EXISTS idx_evaluations_recommendation ON evaluations(recommendation);

-- Trigger for updated_at
CREATE TRIGGER update_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
