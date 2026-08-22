-- ============================================================
-- ICONIC ESTATES INDIA — CRM Phase 5 Migration
-- Customer Portal: OTP login, chat with executive, brochure link,
-- and allowing customers (not just admin users) to upload documents.
-- Run with: mysql -u root -p iconic_estates_india < migration_crm_phase5.sql
-- Safe to re-run (idempotent).
-- ============================================================

USE iconic_estates_india;

-- Brochure attachment per property (used by the "Download Brochure" portal action)
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='properties' AND COLUMN_NAME='brochure_url');
SET @sql := IF(@col = 0, 'ALTER TABLE properties ADD COLUMN brochure_url VARCHAR(500) NULL AFTER hero_image', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- OTP codes for passwordless customer-portal login (by mobile number)
CREATE TABLE IF NOT EXISTS customer_otps (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  mobile      VARCHAR(20) NOT NULL,
  otp_code    VARCHAR(10) NOT NULL,
  expires_at  DATETIME NOT NULL,
  consumed    TINYINT(1) DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_mobile (mobile, consumed)
) ENGINE=InnoDB;

-- Two-way message thread between a customer and their assigned executive
CREATE TABLE IF NOT EXISTS customer_messages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  entity_type  ENUM('lead','inquiry') NOT NULL,
  entity_id    INT NOT NULL,
  sender       ENUM('customer','admin') NOT NULL,
  sender_name  VARCHAR(120),
  message      TEXT NOT NULL,
  is_read      TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_msg_entity (entity_type, entity_id)
) ENGINE=InnoDB;

-- Allow crm_documents to be uploaded by a customer (no users.id) as well as an admin
SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='crm_documents' AND COLUMN_NAME='uploaded_by_customer');
SET @sql := IF(@col = 0, 'ALTER TABLE crm_documents ADD COLUMN uploaded_by_customer TINYINT(1) DEFAULT 0 AFTER uploaded_by', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- uploaded_by must become nullable so a customer upload (no admin user id) can be stored
ALTER TABLE crm_documents MODIFY COLUMN uploaded_by INT NULL;
