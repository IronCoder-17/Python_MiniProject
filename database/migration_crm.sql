-- ============================================================
-- ICONIC ESTATES INDIA — CRM Phase 1 Migration
-- Adds: assignment, lead scoring, last-contact tracking,
--       notes, follow-ups, and activity timeline for both
--       leads and property inquiries.
-- Run with: mysql -u root -p iconic_estates_india < migration_crm.sql
-- Safe to re-run (all statements are idempotent).
-- ============================================================

USE iconic_estates_india;

-- ----------------------------------------------------------------
-- Extend LEADS: assignment, scoring, last contact, richer status
-- ----------------------------------------------------------------
ALTER TABLE leads
  MODIFY COLUMN status ENUM(
    'New','Contacted','Qualified','Site Visit Scheduled','Visited',
    'Negotiation','Booking','Payment','Completed','Closed','Lost'
  ) DEFAULT 'New';

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='assigned_to');
SET @sql := IF(@col = 0, 'ALTER TABLE leads ADD COLUMN assigned_to INT NULL AFTER status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='assignment_status');
SET @sql := IF(@col = 0, "ALTER TABLE leads ADD COLUMN assignment_status ENUM('Unassigned','Assigned','Reassigned') DEFAULT 'Unassigned' AFTER assigned_to", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='lead_score');
SET @sql := IF(@col = 0, 'ALTER TABLE leads ADD COLUMN lead_score INT DEFAULT 0 AFTER assignment_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='last_contact_date');
SET @sql := IF(@col = 0, 'ALTER TABLE leads ADD COLUMN last_contact_date DATETIME NULL AFTER lead_score', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='leads' AND COLUMN_NAME='preferred_visit_date');
SET @sql := IF(@col = 0, 'ALTER TABLE leads ADD COLUMN preferred_visit_date DATE NULL AFTER last_contact_date', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='leads' AND CONSTRAINT_NAME='fk_leads_assigned_to');
SET @sql := IF(@fk = 0, 'ALTER TABLE leads ADD CONSTRAINT fk_leads_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------------
-- Extend INQUIRIES: assignment, last contact, richer status
-- ----------------------------------------------------------------
ALTER TABLE inquiries
  MODIFY COLUMN status ENUM(
    'New','Contacted','Qualified','Site Visit Scheduled','Visited',
    'Negotiation','Booking','Payment','Completed','Closed','Lost'
  ) DEFAULT 'New';

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='inquiries' AND COLUMN_NAME='assigned_to');
SET @sql := IF(@col = 0, 'ALTER TABLE inquiries ADD COLUMN assigned_to INT NULL AFTER status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='inquiries' AND COLUMN_NAME='assignment_status');
SET @sql := IF(@col = 0, "ALTER TABLE inquiries ADD COLUMN assignment_status ENUM('Unassigned','Assigned','Reassigned') DEFAULT 'Unassigned' AFTER assigned_to", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='inquiries' AND COLUMN_NAME='lead_score');
SET @sql := IF(@col = 0, 'ALTER TABLE inquiries ADD COLUMN lead_score INT DEFAULT 0 AFTER assignment_status', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='inquiries' AND COLUMN_NAME='last_contact_date');
SET @sql := IF(@col = 0, 'ALTER TABLE inquiries ADD COLUMN last_contact_date DATETIME NULL AFTER lead_score', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME='inquiries' AND CONSTRAINT_NAME='fk_inquiries_assigned_to');
SET @sql := IF(@fk = 0, 'ALTER TABLE inquiries ADD CONSTRAINT fk_inquiries_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------------
-- CRM NOTES — polymorphic: attaches to a lead OR an inquiry
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_notes (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  entity_type   ENUM('lead','inquiry') NOT NULL,
  entity_id     INT NOT NULL,
  admin_id      INT NOT NULL,
  note          TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notes_entity (entity_type, entity_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- CRM FOLLOW-UPS — scheduler for calls / meetings / site visits
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_followups (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  entity_type    ENUM('lead','inquiry') NOT NULL,
  entity_id      INT NOT NULL,
  type           ENUM('Call','Meeting','Site Visit','Reminder') NOT NULL,
  due_date       DATETIME NOT NULL,
  notes          VARCHAR(500),
  status         ENUM('Pending','Completed','Missed','Cancelled') DEFAULT 'Pending',
  created_by     INT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_followups_entity (entity_type, entity_id),
  INDEX idx_followups_due (due_date, status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- CRM ACTIVITY TIMELINE — auto-logged + manual events
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_activity (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  entity_type   ENUM('lead','inquiry') NOT NULL,
  entity_id     INT NOT NULL,
  activity_type VARCHAR(50) NOT NULL,   -- Created, Called, WhatsApp Sent, Emailed, Status Changed, Site Visit Booked, Note Added, Assigned, ...
  description   VARCHAR(500),
  admin_id      INT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activity_entity (entity_type, entity_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- CRM DOCUMENTS — customer document uploads (Phase 3, table added now)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_documents (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  entity_type   ENUM('lead','inquiry') NOT NULL,
  entity_id     INT NOT NULL,
  doc_type      ENUM('PAN','Aadhaar','Passport','Income Proof','Booking Form','Agreement','Payment Receipt','Other') NOT NULL,
  file_url      VARCHAR(500) NOT NULL,
  uploaded_by   INT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_docs_entity (entity_type, entity_id)
) ENGINE=InnoDB;
