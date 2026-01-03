-- Migration: Support multiple attempts per scenario
-- This allows teachers to complete scenarios multiple times as required

-- Step 1: Drop the unique constraint that prevents multiple attempts
ALTER TABLE `teacher_aiscenario_attempts` 
DROP INDEX IF EXISTS `unique_teacher_scenario`;

-- Step 2: Add attempt_number column
ALTER TABLE `teacher_aiscenario_attempts`
ADD COLUMN IF NOT EXISTS `attempt_number` INT NOT NULL DEFAULT 1 AFTER `scenario_id`;

-- Step 3: Create new unique constraint for teacher + scenario + attempt_number
ALTER TABLE `teacher_aiscenario_attempts`
ADD UNIQUE KEY `unique_teacher_scenario_attempt` (`teacher_id`, `scenario_id`, `attempt_number`);

-- Step 4: Add index for attempt_number
ALTER TABLE `teacher_aiscenario_attempts`
ADD INDEX IF NOT EXISTS `idx_attempt_number` (`attempt_number`);

-- Step 5: Update existing records to have attempt_number = 1
UPDATE `teacher_aiscenario_attempts` 
SET `attempt_number` = 1 
WHERE `attempt_number` IS NULL OR `attempt_number` = 0;

