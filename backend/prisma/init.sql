-- Initial database setup for SarjEt
-- This file is executed when the MySQL container is first created

-- Create database if not exists (already handled by docker-compose env vars)
-- CREATE DATABASE IF NOT EXISTS sarjet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- USE sarjet;

-- Grant privileges (already handled by docker-compose)
-- Note: User creation and privileges are automatically handled by MySQL container
-- using MYSQL_USER and MYSQL_PASSWORD environment variables

-- Set timezone
SET time_zone = '+00:00';

-- Optional: Create additional configurations here if needed
