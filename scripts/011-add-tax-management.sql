-- Tax Management Migration

-- 1. Tax Rules Table
CREATE TABLE IF NOT EXISTS tax_rules (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(6,2) NOT NULL,
  type VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Add tax_rule_id to inventory_items (for product/service tax assignment)
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS tax_rule_id INTEGER REFERENCES tax_rules(id);

-- 3. Add tax_rule_id and tax_amount to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rule_id INTEGER REFERENCES tax_rules(id);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0;

-- 4. Tax Reports Table
CREATE TABLE IF NOT EXISTS tax_reports (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period VARCHAR(10) NOT NULL, -- e.g. 2024-05
  type VARCHAR(50) NOT NULL,
  total NUMERIC(14,2) NOT NULL,
  filed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Tax Filings Table
CREATE TABLE IF NOT EXISTS tax_filings (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period VARCHAR(10) NOT NULL,
  type VARCHAR(50) NOT NULL,
  filed BOOLEAN DEFAULT FALSE,
  doc_url VARCHAR(255),
  filed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
); 