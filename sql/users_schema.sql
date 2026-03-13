-- ============================================================
--  Census Application – Users / Auth Schema
--  Run against censusdb:
--    mysql -u root -p censusdb < users_schema.sql
-- ============================================================

USE censusdb;

CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)   NOT NULL UNIQUE,
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL  COMMENT 'bcrypt hash',
  full_name     VARCHAR(200)  NOT NULL DEFAULT '',
  role          ENUM('admin','user','manager','compliance','hr') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  last_login    DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_username (username),
  INDEX idx_email    (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Default admin account ─────────────────────────────────────────────────────
-- Username : admin
-- Password : Admin@123
-- Hash generated with bcrypt, cost factor 10
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES (
  'admin',
  'admin@census.local',
  '$2b$10$OXUZ85j21qjF/mK15F73ReL4ee6lSD5ZIh6GUx4UczogCZ1OxLPca',
  'System Administrator',
  'admin'
)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name     = VALUES(full_name),
  role          = VALUES(role),
  is_active     = 1;


-- ── Manager user ─────────────────────────────────────────────────────────────
-- Username : manager  |  Password : Manager@123
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

-- ── Compliance user ──────────────────────────────────────────────────────────
-- Username : compliance  |  Password : Compliance@123
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

-- ── HR user ──────────────────────────────────────────────────────────────────
-- Username : hr  |  Password : HR@1234
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
-- ── Verify all users ─────────────────────────────────────────────────────────
SELECT id, username, email, full_name, role, is_active, created_at
FROM users;
