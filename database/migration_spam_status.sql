-- ============================================================
-- Migration: Add 'Spam' status to leads & inquiries pipelines
-- The original brief calls for a distinct Spam bucket in Inquiry
-- Management, separate from the sales pipeline (New/Contacted/
-- Qualified/.../Lost). Safe to re-run.
-- Run with: mysql -u root -p iconic_estates_india < migration_spam_status.sql
-- ============================================================

USE iconic_estates_india;

ALTER TABLE leads
  MODIFY COLUMN status ENUM(
    'New','Contacted','Qualified','Site Visit Scheduled','Visited',
    'Negotiation','Booking','Payment','Completed','Closed','Lost','Spam'
  ) DEFAULT 'New';

ALTER TABLE inquiries
  MODIFY COLUMN status ENUM(
    'New','Contacted','Qualified','Site Visit Scheduled','Visited',
    'Negotiation','Booking','Payment','Completed','Closed','Lost','Spam'
  ) DEFAULT 'New';
