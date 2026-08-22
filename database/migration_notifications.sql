-- ============================================================
-- Migration: Notifications table
-- Backs the admin NotificationBell.js component. Persisted rows
-- cover event-based notifications (New Lead, New Inquiry, Booking
-- Completed). "Site Visit Today" and "Follow-up Due" are computed
-- live from crm_site_visits / crm_followups at read time — see
-- notificationsController.js — so they don't need a stored row.
-- Idempotent — safe to re-run.
-- ============================================================

USE iconic_estates_india;

CREATE TABLE IF NOT EXISTS notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  type         VARCHAR(50) NOT NULL,   -- 'New Lead' | 'New Inquiry' | 'Booking Completed'
  title        VARCHAR(255) NOT NULL,
  message      VARCHAR(500),
  entity_type  ENUM('lead','inquiry') NULL,
  entity_id    INT NULL,
  is_read      TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_created (created_at)
) ENGINE=InnoDB;