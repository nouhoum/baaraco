CREATE TABLE IF NOT EXISTS interview_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_profile_id UUID NOT NULL REFERENCES proof_profiles(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,

    total_duration_minutes INT NOT NULL DEFAULT 60,

    -- Sections with questions (JSONB array)
    -- Each: { title, duration_minutes, questions: [{ question, context, positive_signals, negative_signals, follow_up }] }
    sections JSONB NOT NULL DEFAULT '[]',

    -- Debrief template
    -- { criteria: [{ name, score, reevaluate }], final_recommendation_prompt }
    debrief_template JSONB NOT NULL DEFAULT '{}',

    -- Notes taken by recruiter during interview (JSONB object)
    -- { "section_0_question_0": "note text", ... }
    notes JSONB NOT NULL DEFAULT '{}',

    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    UNIQUE(proof_profile_id)
);

CREATE INDEX idx_interview_kits_job_candidate ON interview_kits(job_id, candidate_id);
