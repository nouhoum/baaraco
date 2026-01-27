-- Scorecard table: stores evaluation criteria generated for a job
CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    -- Criteria stored as JSONB array
    -- Each criterion: { name, description, weight, positive_signals[], negative_signals[], red_flags[] }
    criteria JSONB NOT NULL DEFAULT '[]',

    -- Generation metadata
    generated_at TIMESTAMP WITH TIME ZONE,
    prompt_version VARCHAR(50),  -- Version of the prompt used for generation

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(job_id)  -- One scorecard per job
);

-- Job Work Sample table: stores work sample template generated for a job
CREATE TABLE IF NOT EXISTS job_work_samples (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    scorecard_id UUID REFERENCES scorecards(id) ON DELETE SET NULL,

    -- Introduction and rules
    intro_message TEXT,
    rules JSONB DEFAULT '[]',  -- Array of rule strings

    -- Sections stored as JSONB array
    -- Each section: { title, description, instructions, estimated_time_minutes, criteria_evaluated[], rubric }
    sections JSONB NOT NULL DEFAULT '[]',

    -- Total estimated time in minutes
    estimated_time_minutes INT,

    -- Generation metadata
    generated_at TIMESTAMP WITH TIME ZONE,
    prompt_version VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(job_id)  -- One work sample per job
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scorecards_job_id ON scorecards(job_id);
CREATE INDEX IF NOT EXISTS idx_job_work_samples_job_id ON job_work_samples(job_id);
CREATE INDEX IF NOT EXISTS idx_job_work_samples_scorecard_id ON job_work_samples(scorecard_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scorecards_updated_at
    BEFORE UPDATE ON scorecards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_work_samples_updated_at
    BEFORE UPDATE ON job_work_samples
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
