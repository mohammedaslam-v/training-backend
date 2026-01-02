-- Migration: Add evaluation column to teacher_aiscenario_attempts table
-- Date: 2024-01-XX
-- Description: Adds a JSON column to store complete Tough Tongue AI evaluation results

ALTER TABLE `teacher_aiscenario_attempts` 
ADD COLUMN `evaluation` JSON NULL AFTER `session_id`;

-- The evaluation column will store:
-- - final_score or overall_score
-- - detailed_feedback
-- - strengths
-- - weaknesses
-- - transcript_content
-- - duration
-- - completed_at
-- - Any other evaluation data from Tough Tongue AI


