-- Track conversation count between user and agent in posts
CREATE TABLE IF NOT EXISTS `post_agent_conversation_counts` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `profile_id` VARCHAR(36) NOT NULL,
  `reply_count` INT DEFAULT 0,
  `last_reply_at` DATETIME,
  `created_at` DATETIME,
  `updated_at` DATETIME,
  UNIQUE KEY `idx_user_profile` (`user_id`, `profile_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_profile_id` (`profile_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
