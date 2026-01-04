-- Enhance Sales Module

-- 1. Add status to sales_invoices
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

-- 2. Status history table
CREATE TABLE IF NOT EXISTS sales_invoice_status_history (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
  old_status VARCHAR(20),
  new_status VARCHAR(20) NOT NULL,
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- 3. Customers table (if not exists)
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Products table (if not exists)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50),
  price NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
); 