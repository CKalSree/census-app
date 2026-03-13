-- ============================================================
--  Census Application – Add Manager, Compliance & HR Users
--  Run against censusdb:
--    mysql -u root -p censusdb < add_users.sql
-- ============================================================

USE censusdb;

-- ── Step 1: Extend the role ENUM to include new roles ─────────────────────────
-- ALTER COLUMN modifies in-place without dropping data
ALTER TABLE users
  MODIFY COLUMN role ENUM('admin','user','manager','compliance','hr')
  NOT NULL DEFAULT 'user';

-- Confirm the column definition updated
DESCRIBE users;

-- ── Step 2: Insert the 3 new users ───────────────────────────────────────────
-- If the username already exists, update the record instead of failing.

-- ── Manager ──────────────────────────────────────────────────────────────────
-- Username : manager
-- Password : Manager@123
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES (
  'manager',
  'manager@census.local',
  '$2b$10$YQBxkT9M/Aeutgf1dsuoKe5UuW5tCvohKrO9BwxWP1EVIdXVRg8LC',
  'Census Manager',
  'manager',
  1
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name     = VALUES(full_name),
  role          = VALUES(role),
  is_active     = 1;

-- ── Compliance ───────────────────────────────────────────────────────────────
-- Username : compliance
-- Password : Compliance@123
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES (
  'compliance',
  'compliance@census.local',
  '$2b$10$UOwZ1YfmJnVwMh8jQVf3QO3UG72UeVoEhbLYq7up9K.Eg0R6cl3fG',
  'Compliance Officer',
  'compliance',
  1
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name     = VALUES(full_name),
  role          = VALUES(role),
  is_active     = 1;

-- ── HR ───────────────────────────────────────────────────────────────────────
-- Username : hr
-- Password : HR@1234
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
VALUES (
  'hr',
  'hr@census.local',
  '$2b$10$7HpFaDZzsbQkBWViZa4QFueBNPXWgc8DYWYDCOAdsObzcDgcgBtFu',
  'HR Officer',
  'hr',
  1
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name     = VALUES(full_name),
  role          = VALUES(role),
  is_active     = 1;

-- ── Step 3: Verify all users ──────────────────────────────────────────────────
SELECT
  id,
  username,
  email,
  full_name,
  role,
  is_active,
  LEFT(password_hash, 7) AS hash_prefix,   -- should be $2b$10$
  created_at
FROM users
ORDER BY id;
