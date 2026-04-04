-- 为已有的人生 Agent 批量补上预设封面（仅处理「未设预设且未设自定义图」的记录）
-- 按 created_at 排序，8 张插画循环分配。
--
-- 在服务器执行示例（密码按实际修改）：
--   mysql -h127.0.0.1 -uroot -p agent_marketplace < scripts/assign-life-agent-cover-presets.sql
-- Docker 内示例：
--   docker compose exec -T mysql mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" agent_marketplace < scripts/assign-life-agent-cover-presets.sql

USE agent_marketplace;

UPDATE life_agent_profiles AS p
INNER JOIN (
  SELECT
    id,
    MOD(ROW_NUMBER() OVER (ORDER BY created_at ASC) - 1, 8) + 1 AS preset_idx
  FROM life_agent_profiles
  WHERE
    (cover_preset_key IS NULL OR TRIM(cover_preset_key) = '')
    AND (cover_image_url IS NULL OR TRIM(cover_image_url) = '')
) AS n ON p.id = n.id
SET p.cover_preset_key = ELT(
  n.preset_idx,
  '01-student-panda',
  '02-robot-pro',
  '03-scholar-owl',
  '04-social-fox',
  '05-achiever-dino',
  '06-wellness-cloud',
  '07-city-bear',
  '08-service-dog'
);

-- 查看结果（可选）
-- SELECT id, display_name, cover_preset_key, cover_image_url, created_at
-- FROM life_agent_profiles
-- ORDER BY created_at;
