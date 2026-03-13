-- ============================================================
--  Census Application – MySQL Schema
--  Run this file once to initialise the database:
--    mysql -u root -p < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS census_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE census_db;

CREATE TABLE IF NOT EXISTS census_records (
  id          INT           NOT NULL AUTO_INCREMENT,
  first_name  VARCHAR(100)  NOT NULL,
  last_name   VARCHAR(100)  NOT NULL,
  ssn         VARCHAR(11)   NOT NULL UNIQUE COMMENT 'Format: XXX-XX-XXXX',
  email       VARCHAR(255)  NOT NULL,
  eid         VARCHAR(50)   NOT NULL UNIQUE COMMENT 'Employee / Entity ID',
  status      ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_email   (email),
  INDEX idx_eid     (eid),
  INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: seed one demo row so the View Records tab is never empty
INSERT IGNORE INTO census_records (first_name, last_name, ssn, email, eid)
VALUES ('Jane', 'Demo', '000-00-0001', 'jane.demo@example.com', '100001');
