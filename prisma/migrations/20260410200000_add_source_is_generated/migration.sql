-- AlterTable
ALTER TABLE `life_agent_profiles` ADD COLUMN `source` VARCHAR(255) NULL;
ALTER TABLE `life_agent_profiles` ADD COLUMN `is_generated` BOOLEAN NOT NULL DEFAULT false;
