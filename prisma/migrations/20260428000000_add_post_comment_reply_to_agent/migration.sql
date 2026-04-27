-- Add reply_to_agent_id to post_comments to support replying to Agent comments
ALTER TABLE `post_comments` ADD COLUMN `reply_to_agent_id` VARCHAR(36) NULL AFTER `user_id`;
ALTER TABLE `post_comments` ADD INDEX `idx_post_comments_reply_to_agent` (`reply_to_agent_id`);
