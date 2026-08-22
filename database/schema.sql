-- ============================================================
-- ICONIC ESTATES INDIA — MySQL Schema
-- "Where Capital Meets Opportunity"
-- ============================================================
-- Run with: mysql -u root -p < schema.sql
-- Engine/charset chosen for full unicode (₹, Hindi/regional names) support.

CREATE DATABASE IF NOT EXISTS iconic_estates_india
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE iconic_estates_india;

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------
-- USERS & AUTH (JWT-based, role based access control)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          ENUM('super_admin','admin','agent') NOT NULL DEFAULT 'admin',
  is_active     TINYINT(1)    NOT NULL DEFAULT 1,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- BUILDERS / DEVELOPERS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builders (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150)  NOT NULL,
  logo_url          VARCHAR(500),
  years_experience  INT           DEFAULT 0,
  total_projects    INT           DEFAULT 0,
  cities_served     VARCHAR(500),          -- comma separated for simplicity
  description       TEXT,
  rera_registration VARCHAR(100),
  website           VARCHAR(255),
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- PROPERTIES
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS properties (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  title               VARCHAR(200) NOT NULL,
  category            ENUM('Residential','Commercial','Agricultural','Luxury') NOT NULL,
  property_type       VARCHAR(100) NOT NULL,   -- Villa, Flat, Office, Farmhouse, etc.
  price               DECIMAL(14,2) NOT NULL,  -- stored in INR
  price_label         VARCHAR(50),             -- e.g. "₹ 2.45 Crore" (precomputed for display)
  location_area       VARCHAR(150) NOT NULL,   -- e.g. Bopal
  city                VARCHAR(100) NOT NULL,
  state               VARCHAR(100) NOT NULL DEFAULT 'India',
  latitude            DECIMAL(10,7),
  longitude           DECIMAL(10,7),
  area_sqft           INT NOT NULL,
  bedrooms            INT DEFAULT 0,
  bathrooms           INT DEFAULT 0,
  parking             INT DEFAULT 0,
  possession_status   ENUM('Ready To Move','Under Construction','New Launch') NOT NULL,
  rera_number         VARCHAR(100),
  builder_id          INT,
  luxury_rating       TINYINT DEFAULT 3,        -- 1-5 stars
  description         TEXT,
  amenities           TEXT,                     -- comma separated tags
  hero_image          VARCHAR(500),
  is_featured         TINYINT(1) DEFAULT 0,
  views_count         INT DEFAULT 0,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (builder_id) REFERENCES builders(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_category ON properties(category);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_bedrooms ON properties(bedrooms);

-- ----------------------------------------------------------------
-- PROPERTY IMAGES (gallery: living room, kitchen, exterior, etc.)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS property_images (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  property_id  INT NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  tag          VARCHAR(100), -- Hero, Living Room, Kitchen, Bedroom, Bathroom, Exterior, Amenities
  sort_order   INT DEFAULT 0,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- FLOOR PLANS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS floor_plans (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  property_id  INT NOT NULL,
  plan_name    VARCHAR(100),
  image_url    VARCHAR(500),
  area_sqft    INT,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- REAL ESTATE EXPERTS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS civil_engineers (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(150) NOT NULL,
  photo_url           VARCHAR(500),
  experience_years    INT DEFAULT 0,
  projects_completed  INT DEFAULT 0,
  specialization      VARCHAR(255),
  city                VARCHAR(100),
  bio                 TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS interior_designers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  photo_url         VARCHAR(500),
  experience_years  INT DEFAULT 0,
  design_style      VARCHAR(255),
  city              VARCHAR(100),
  bio               TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS exterior_designers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  photo_url         VARCHAR(500),
  experience_years  INT DEFAULT 0,
  specialty         VARCHAR(255),
  city              VARCHAR(100),
  bio               TEXT,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- LEADS (from lead generation forms across the site)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leads (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(150) NOT NULL,
  mobile_number  VARCHAR(20)  NOT NULL,
  email          VARCHAR(150),
  city           VARCHAR(100),
  budget         VARCHAR(100),
  property_type  VARCHAR(100),
  message        TEXT,
  source_page    VARCHAR(150) DEFAULT 'website',
  status         ENUM('New','Contacted','Qualified','Closed','Lost') DEFAULT 'New',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE INDEX idx_leads_created ON leads(created_at);

-- ----------------------------------------------------------------
-- PROPERTY INQUIRIES (contact-owner / schedule-visit on a listing)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  property_id    INT NOT NULL,
  full_name      VARCHAR(150) NOT NULL,
  mobile_number  VARCHAR(20)  NOT NULL,
  email          VARCHAR(150),
  inquiry_type   ENUM('Contact Owner','Schedule Site Visit','Request Callback') DEFAULT 'Contact Owner',
  preferred_date DATE NULL,
  message        TEXT,
  status         ENUM('New','Contacted','Closed') DEFAULT 'New',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- MARKET REPORTS / INTELLIGENCE (city growth indices over time)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS market_reports (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  city                VARCHAR(100) NOT NULL,
  index_name          VARCHAR(150) NOT NULL, -- e.g. "Ahmedabad Growth Index"
  growth_1yr_pct      DECIMAL(5,2),
  growth_3yr_pct      DECIMAL(5,2),
  growth_5yr_pct      DECIMAL(5,2),
  growth_10yr_pct     DECIMAL(5,2),
  rental_yield_pct    DECIMAL(5,2),
  report_date         DATE,
  notes                TEXT,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- TESTIMONIALS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS testimonials (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  quote         TEXT NOT NULL,
  author_name   VARCHAR(150),
  author_title  VARCHAR(150),
  is_published  TINYINT(1) DEFAULT 1,
  sort_order    INT DEFAULT 0
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- OWNERSHIP JOURNEY (static-ish, but editable timeline content)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ownership_journey (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  step_number  INT NOT NULL,
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  icon         VARCHAR(100)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- ICONIC ADDRESSES (premium micro-markets shown on homepage)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS iconic_addresses (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  city         VARCHAR(100) NOT NULL,
  locality     VARCHAR(150) NOT NULL,
  image_url    VARCHAR(500),
  blurb        VARCHAR(255),
  avg_price_per_sqft DECIMAL(10,2)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- PLATFORM COUNTERS ("By The Numbers")
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_stats (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  stat_key     VARCHAR(100) NOT NULL UNIQUE,
  stat_value   VARCHAR(50)  NOT NULL,
  stat_label   VARCHAR(150) NOT NULL,
  sort_order   INT DEFAULT 0
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
