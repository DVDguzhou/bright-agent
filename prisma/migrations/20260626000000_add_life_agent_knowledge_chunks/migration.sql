CREATE TABLE IF NOT EXISTS `life_agent_knowledge_chunks` (
  `id` varchar(36) NOT NULL,
  `profile_id` varchar(36) NOT NULL,
  `entry_id` varchar(36) NOT NULL,
  `entry_revision` int NOT NULL DEFAULT 1,
  `chunk_index` int NOT NULL,
  `content` text NOT NULL,
  `char_start` int NOT NULL DEFAULT 0,
  `char_end` int NOT NULL DEFAULT 0,
  `embedding` mediumblob NULL,
  `embed_model` varchar(64) NULL,
  `embed_at` datetime(3) NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `life_agent_knowledge_chunks_entry_chunk_key` (`entry_id`, `chunk_index`),
  KEY `life_agent_knowledge_chunks_profile_id_idx` (`profile_id`),
  KEY `life_agent_knowledge_chunks_entry_id_idx` (`entry_id`),
  CONSTRAINT `life_agent_knowledge_chunks_entry_id_fkey`
    FOREIGN KEY (`entry_id`) REFERENCES `life_agent_knowledge_entries` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
