-- Drop evaluations table
DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
DROP TABLE IF EXISTS evaluations;
