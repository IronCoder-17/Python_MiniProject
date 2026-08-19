-- ============================================================
-- Migration: Property media links + listing outcome status
-- Adds: brochure_url, video_url, virtual_tour_url, is_sold, is_rented
-- Idempotent — safe to run multiple times, and safe if some of
-- these columns already exist on your database (e.g. from a
-- previous partial run). Each column is only added if missing.
-- Run with: mysql -u root -p iconic_estates_india < migration_property_media.sql
-- ============================================================

USE iconic_estates_india;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND COLUMN_NAME='brochure_url');
SET @sql := IF(@col = 0, 'ALTER TABLE properties ADD COLUMN brochure_url VARCHAR(500) NULL AFTER hero_image', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND COLUMN_NAME='video_url');
SET @sql := IF(@col = 0, 'ALTER TABLE properties ADD COLUMN video_url VARCHAR(500) NULL AFTER brochure_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND COLUMN_NAME='virtual_tour_url');
SET @sql := IF(@col = 0, 'ALTER TABLE properties ADD COLUMN virtual_tour_url VARCHAR(500) NULL AFTER video_url', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND COLUMN_NAME='is_sold');
SET @sql := IF(@col = 0, 'ALTER TABLE properties ADD COLUMN is_sold TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND COLUMN_NAME='is_rented');
SET @sql := IF(@col = 0, 'ALTER TABLE properties ADD COLUMN is_rented TINYINT(1) NOT NULL DEFAULT 0 AFTER is_sold', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND INDEX_NAME='idx_properties_is_sold');
SET @sql := IF(@idx = 0, 'CREATE INDEX idx_properties_is_sold ON properties(is_sold)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND INDEX_NAME='idx_properties_is_rented');
SET @sql := IF(@idx = 0, 'CREATE INDEX idx_properties_is_rented ON properties(is_rented)', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
