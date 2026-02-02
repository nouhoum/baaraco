-- Interview sessions table for conversational AI interviews
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES work_sample_attempts(id) ON DELETE CASCADE,
    messages JSONB NOT NULL DEFAULT '[]',
    current_topic_index INT NOT NULL DEFAULT 0,
    topics_completed JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'not_started'
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'timed_out', 'abandoned')),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    max_duration_minutes INT NOT NULL DEFAULT 45,
    timing_metadata JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(attempt_id)
);

CREATE INDEX idx_interview_sessions_attempt ON interview_sessions(attempt_id);

CREATE TRIGGER update_interview_sessions_updated_at
    BEFORE UPDATE ON interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add interview mode to work sample attempts (form = legacy, conversation = new)
ALTER TABLE work_sample_attempts ADD COLUMN interview_mode VARCHAR(20) NOT NULL DEFAULT 'form';
