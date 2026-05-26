-- CreateTable
CREATE TABLE `life_agent_co_edit_events` (
    `id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `raw_message` TEXT NOT NULL,
    `status` VARCHAR(16) NOT NULL DEFAULT 'pending',
    `assistant_message` TEXT NULL,
    `changes_summary` TEXT NULL,
    `error_detail` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processed_at` DATETIME(3) NULL,

    INDEX `life_agent_co_edit_events_profile_id_idx`(`profile_id`),
    INDEX `life_agent_co_edit_events_user_id_idx`(`user_id`),
    INDEX `life_agent_co_edit_events_status_idx`(`status`),
    INDEX `life_agent_co_edit_events_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
