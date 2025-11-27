-- ============================================
-- MySQL Initialization Script
-- ============================================
-- This script runs automatically when the MySQL container
-- initializes with a fresh volume (first-time setup only).
--
-- Execution order is determined by filename (01-, 02-, etc.)
-- ============================================

-- Grant necessary privileges for application user
-- Note: chat_user can create databases (needed for Prisma shadow DB)
GRANT ALL PRIVILEGES ON *.* TO 'chat_user'@'%' WITH GRANT OPTION;

-- Apply privilege changes
FLUSH PRIVILEGES;
