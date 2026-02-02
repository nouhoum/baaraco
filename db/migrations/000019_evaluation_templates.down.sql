ALTER TABLE proof_profiles DROP COLUMN IF EXISTS evaluation_template_id;
ALTER TABLE evaluations DROP COLUMN IF EXISTS evaluation_template_id;
DROP INDEX IF EXISTS idx_wsa_eval_template;
ALTER TABLE work_sample_attempts DROP COLUMN IF EXISTS evaluation_template_id;
ALTER TABLE evaluations ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE proof_profiles ALTER COLUMN job_id SET NOT NULL;
ALTER TABLE interview_kits ALTER COLUMN job_id SET NOT NULL;
DROP TABLE IF EXISTS evaluation_templates;
