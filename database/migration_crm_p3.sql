-- ============================================================
-- ICONIC ESTATES INDIA — CRM Phase 3 Migration
-- Site Visit Management + Customer Preferences
-- (crm_documents table was already created in migration_crm.sql / Phase 1)
-- Run with: mysql -u root -p iconic_estates_india < migration_crm_phase3.sql
-- Safe to re-run (idempotent).
-- ============================================================

USE iconic_estates_india;

-- ----------------------------------------------------------------
-- SITE VISITS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_site_visits (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  entity_type     ENUM('lead','inquiry') NOT NULL,
  entity_id       INT NOT NULL,
  property_id     INT NULL,
  visit_date      DATE NOT NULL,
  visit_time      TIME NULL,
  driver_name     VARCHAR(120),
  driver_phone    VARCHAR(20),
  pickup_address  VARCHAR(500),
  executive_id    INT NULL,
  vehicle_number  VARCHAR(50),
  visit_status    ENUM('Scheduled','Confirmed','In Progress','Completed','Cancelled','No Show') DEFAULT 'Scheduled',
  notes           VARCHAR(500),
  created_by      INT NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id)  REFERENCES properties(id) ON DELETE SET NULL,
  FOREIGN KEY (executive_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)   REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_visits_entity (entity_type, entity_id),
  INDEX idx_visits_date (visit_date, visit_status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- CUSTOMER PREFERENCES — one row per lead/inquiry
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS crm_preferences (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  entity_type         ENUM('lead','inquiry') NOT NULL,
  entity_id           INT NOT NULL,
  preferred_location  VARCHAR(255),
  budget_min          DECIMAL(14,2),
  budget_max          DECIMAL(14,2),
  bedrooms            VARCHAR(20),          -- e.g. '2BHK', '3BHK', '4+ BHK'
  amenities           VARCHAR(500),          -- comma separated
  loan_required       TINYINT(1) DEFAULT 0,
  purpose             ENUM('Investment','Self Use') DEFAULT 'Self Use',
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_pref_entity (entity_type, entity_id)
) ENGINE=InnoDB;
