-- CreateTable
CREATE TABLE `life_agent_favorites` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `profile_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `life_agent_favorites_user_id_profile_id_key`(`user_id`, `profile_id`),
    INDEX `life_agent_favorites_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `life_agent_favorites` ADD CONSTRAINT `life_agent_favorites_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `life_agent_favorites` ADD CONSTRAINT `life_agent_favorites_profile_id_fkey` FOREIGN KEY (`profile_id`) REFERENCES `life_agent_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
