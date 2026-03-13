-- ============================================================
--  Census Application – Reset admin password
--  Run this if you already ran users_schema.sql but login fails:
--    mysql -u root -p censusdb < reset_admin_password.sql
-- ============================================================

USE censusdb;

-- Update the hash to the correct bcrypt hash for 'Admin@123'
UPDATE users
SET
    password_hash = '$2b$10$OXUZ85j21qjF/mK15F73ReL4ee6lSD5ZIh6GUx4UczogCZ1OxLPca',
    is_active     = 1
WHERE username = 'admin';

-- If admin row didn't exist yet, insert it
INSERT INTO users (username, email, password_hash, full_name, role, is_active)
SELECT 'admin', 'admin@census.local',
       '$2b$10$OXUZ85j21qjF/mK15F73ReL4ee6lSD5ZIh6GUx4UczogCZ1OxLPca',
       'System Administrator', 'admin', 1
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Confirm
SELECT id, username, email, role, is_active,
       LEFT(password_hash, 7) AS hash_prefix  -- should show $2b$10$
FROM users WHERE username = 'admin';
