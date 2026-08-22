-- ============================================================
-- ICONIC ESTATES INDIA — CRM Phase 4 Migration
-- Notifications (New Lead, New Inquiry, Booking Completed, etc.)
-- Dashboard Analytics reads from existing tables — no schema change needed there.
-- Run with: mysql -u root -p iconic_estates_india < migration_crm_phase4.sql
-- Safe to re-run (idempotent).
-- ============================================================

USE iconic_estates_india;

CREATE TABLE IF NOT EXISTS crm_notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  type         ENUM('New Lead','New Inquiry','Site Visit Today','Follow-up Due','Booking Completed') NOT NULL,
  title        VARCHAR(255) NOT NULL,
  message      VARCHAR(500),
  entity_type  ENUM('lead','inquiry') NULL,
  entity_id    INT NULL,
  is_read      TINYINT(1) DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_read (is_read, created_at)
) ENGINE=InnoDB;
