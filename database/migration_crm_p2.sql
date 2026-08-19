-- ============================================================
-- ICONIC ESTATES INDIA — CRM Phase 2 Migration
-- WhatsApp & Email message templates (admin-editable)
-- Run with: mysql -u root -p iconic_estates_india < migration_crm_phase2.sql
-- Safe to re-run (idempotent).
-- ============================================================

USE iconic_estates_india;

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  message     TEXT NOT NULL,           -- supports {name}, {property}, {city}, {budget}
  is_active   TINYINT(1) DEFAULT 1,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_templates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  subject     VARCHAR(255) NOT NULL,
  body        TEXT NOT NULL,           -- supports {name}, {property}, {city}, {budget}, {executive_name}
  is_active   TINYINT(1) DEFAULT 1,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed defaults only if the tables are empty (won't duplicate on re-run)
INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT * FROM (SELECT 'Welcome' AS name, 'Hi {name}, thank you for your interest with Iconic Estates India! Our team will assist you shortly.' AS message, 1 AS sort_order) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM whatsapp_templates);

INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT 'Property Details', 'Hi {name}, here are the details of {property} in {city}. Budget range: {budget}. Let me know if you have questions!', 2
WHERE (SELECT COUNT(*) FROM whatsapp_templates) <= 1;

INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT 'Location', 'Hi {name}, sharing the exact location of {property} for your reference.', 3
WHERE (SELECT COUNT(*) FROM whatsapp_templates) <= 2;

INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT 'Price List', 'Hi {name}, please find the price list for {property} attached. Happy to discuss further.', 4
WHERE (SELECT COUNT(*) FROM whatsapp_templates) <= 3;

INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT 'Brochure', 'Hi {name}, here is the brochure for {property} with full specifications and amenities.', 5
WHERE (SELECT COUNT(*) FROM whatsapp_templates) <= 4;

INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT 'Site Visit Reminder', 'Hi {name}, this is a reminder for your scheduled site visit to {property}. Looking forward to seeing you!', 6
WHERE (SELECT COUNT(*) FROM whatsapp_templates) <= 5;

INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT 'Payment Reminder', 'Hi {name}, a gentle reminder regarding the pending payment for {property}. Please reach out if you need assistance.', 7
WHERE (SELECT COUNT(*) FROM whatsapp_templates) <= 6;

INSERT INTO whatsapp_templates (name, message, sort_order)
SELECT 'Thank You', 'Hi {name}, thank you for choosing Iconic Estates India. It was a pleasure assisting you!', 8
WHERE (SELECT COUNT(*) FROM whatsapp_templates) <= 7;

INSERT INTO email_templates (name, subject, body, sort_order)
SELECT * FROM (SELECT
  'Welcome' AS name,
  'Welcome to Iconic Estates India' AS subject,
  'Dear {name},\n\nThank you for reaching out to Iconic Estates India. We are delighted to assist you in finding your ideal property.\n\nOur executive {executive_name} will be in touch shortly to understand your requirements better.\n\nWarm regards,\nIconic Estates India' AS body,
  1 AS sort_order) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM email_templates);

INSERT INTO email_templates (name, subject, body, sort_order)
SELECT 'Property Details', 'Details for {property}', 'Dear {name},\n\nAs discussed, please find below the details for {property} in {city}.\n\nBudget: {budget}\n\nFeel free to reach out with any questions.\n\nWarm regards,\n{executive_name}\nIconic Estates India', 2
WHERE (SELECT COUNT(*) FROM email_templates) <= 1;

INSERT INTO email_templates (name, subject, body, sort_order)
SELECT 'Brochure', 'Brochure — {property}', 'Dear {name},\n\nPlease find attached the brochure for {property}, including specifications, floor plans, and amenities.\n\nWarm regards,\n{executive_name}\nIconic Estates India', 3
WHERE (SELECT COUNT(*) FROM email_templates) <= 2;

INSERT INTO email_templates (name, subject, body, sort_order)
SELECT 'Meeting Confirmation', 'Meeting Confirmed — {property}', 'Dear {name},\n\nThis confirms our meeting regarding {property}. We look forward to discussing your requirements in detail.\n\nWarm regards,\n{executive_name}\nIconic Estates India', 4
WHERE (SELECT COUNT(*) FROM email_templates) <= 3;

INSERT INTO email_templates (name, subject, body, sort_order)
SELECT 'Booking Confirmation', 'Booking Confirmed — {property}', 'Dear {name},\n\nCongratulations! Your booking for {property} has been confirmed. Our team will share the next steps shortly.\n\nWarm regards,\n{executive_name}\nIconic Estates India', 5
WHERE (SELECT COUNT(*) FROM email_templates) <= 4;
