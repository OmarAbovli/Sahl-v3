-- Companies table (if not already present)
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chart of Accounts table for multi-company accounting
CREATE TABLE IF NOT EXISTS accounts (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20),
  type VARCHAR(30) NOT NULL, -- e.g. asset, liability, equity, revenue, expense
  parent_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, code)
);

-- Journal Entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  description TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Journal Lines (debits/credits for each entry)
CREATE TABLE IF NOT EXISTS journal_lines (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  debit NUMERIC(14,2) DEFAULT 0,
  credit NUMERIC(14,2) DEFAULT 0,
  description TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers (Accounts Receivable)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(30),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sales Invoices
CREATE TABLE IF NOT EXISTS sales_invoices (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_number VARCHAR(30) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  total NUMERIC(14,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, invoice_number)
);

-- Customer Payments
CREATE TABLE IF NOT EXISTS customer_payments (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_id INTEGER REFERENCES sales_invoices(id),
  amount NUMERIC(14,2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(30),
  reference VARCHAR(50),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers (Accounts Payable)
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(30),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Purchase Invoices
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  invoice_number VARCHAR(30) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  total NUMERIC(14,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, invoice_number)
);

-- Supplier Payments
CREATE TABLE IF NOT EXISTS supplier_payments (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  invoice_id INTEGER REFERENCES purchase_invoices(id),
  amount NUMERIC(14,2) NOT NULL,
  payment_date DATE NOT NULL,
  method VARCHAR(30),
  reference VARCHAR(50),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Warehouses (Inventory)
CREATE TABLE IF NOT EXISTS warehouses (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products (Inventory)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sku VARCHAR(50),
  unit VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inventory Movements
CREATE TABLE IF NOT EXISTS inventory_movements (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
  movement_type VARCHAR(20) NOT NULL, -- in, out, transfer
  quantity NUMERIC(14,2) NOT NULL,
  movement_date DATE NOT NULL,
  reference TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Employees (HR)
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id INTEGER,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(30),
  position VARCHAR(50),
  department VARCHAR(50),
  hire_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Payroll
CREATE TABLE IF NOT EXISTS payrolls (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_salary NUMERIC(14,2) NOT NULL,
  net_salary NUMERIC(14,2) NOT NULL,
  deductions NUMERIC(14,2) DEFAULT 0,
  bonuses NUMERIC(14,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cash & Bank Accounts
CREATE TABLE IF NOT EXISTS cash_bank_accounts (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  account_number VARCHAR(50),
  bank_name VARCHAR(100),
  type VARCHAR(20) NOT NULL, -- cash, bank
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Cash & Bank Transactions
CREATE TABLE IF NOT EXISTS cash_bank_transactions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  account_id INTEGER NOT NULL REFERENCES cash_bank_accounts(id),
  transaction_type VARCHAR(20) NOT NULL, -- deposit, withdrawal, transfer
  amount NUMERIC(14,2) NOT NULL,
  transaction_date DATE NOT NULL,
  reference TEXT,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Fixed Assets
CREATE TABLE IF NOT EXISTS fixed_assets (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  asset_code VARCHAR(50),
  purchase_date DATE,
  cost NUMERIC(14,2) NOT NULL,
  depreciation_method VARCHAR(30),
  useful_life INTEGER,
  salvage_value NUMERIC(14,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Asset Depreciation
CREATE TABLE IF NOT EXISTS asset_depreciation (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  asset_id INTEGER NOT NULL REFERENCES fixed_assets(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  depreciation_amount NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tax Management
CREATE TABLE IF NOT EXISTS taxes (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  rate NUMERIC(6,3) NOT NULL,
  type VARCHAR(30), -- VAT, income, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Invoice Taxes (for sales and purchase invoices)
CREATE TABLE IF NOT EXISTS invoice_taxes (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invoice_type VARCHAR(20) NOT NULL, -- sales, purchase
  invoice_id INTEGER NOT NULL,
  tax_id INTEGER NOT NULL REFERENCES taxes(id),
  amount NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_roles (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER,
  user_id INTEGER,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Approval Workflows
CREATE TABLE IF NOT EXISTS approvals (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  module VARCHAR(50) NOT NULL,
  record_id INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  requested_by INTEGER,
  approved_by INTEGER,
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Period Locking
CREATE TABLE IF NOT EXISTS period_locks (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_locked BOOLEAN DEFAULT TRUE,
  locked_by INTEGER,
  locked_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Financial Reports (metadata for saved reports)
CREATE TABLE IF NOT EXISTS financial_reports (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL, -- balance_sheet, income_statement, etc.
  parameters JSONB,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounts_company ON accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_company ON warehouses(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_company ON payrolls(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_bank_company ON cash_bank_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_cash_bank_tx_company ON cash_bank_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_company ON fixed_assets(company_id);
CREATE INDEX IF NOT EXISTS idx_taxes_company ON taxes(company_id);
CREATE INDEX IF NOT EXISTS idx_roles_company ON roles(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_approvals_company ON approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_period_locks_company ON period_locks(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_company ON financial_reports(company_id);

-- Add comments for documentation
COMMENT ON TABLE companies IS 'Companies registered in the system';
COMMENT ON TABLE accounts IS 'Chart of accounts for each company';
COMMENT ON TABLE journal_entries IS 'General ledger journal entries';
COMMENT ON TABLE journal_lines IS 'Lines for each journal entry (debits/credits)';
COMMENT ON TABLE customers IS 'Customers for AR';
COMMENT ON TABLE sales_invoices IS 'Sales invoices issued to customers';
COMMENT ON TABLE customer_payments IS 'Payments received from customers';
COMMENT ON TABLE suppliers IS 'Suppliers for AP';
COMMENT ON TABLE purchase_invoices IS 'Purchase invoices from suppliers';
COMMENT ON TABLE supplier_payments IS 'Payments made to suppliers';
COMMENT ON TABLE warehouses IS 'Warehouses for inventory';
COMMENT ON TABLE products IS 'Products managed in inventory';
COMMENT ON TABLE inventory_movements IS 'Inventory movement records';
COMMENT ON TABLE employees IS 'Employees for HR/Payroll';
COMMENT ON TABLE payrolls IS 'Payroll records';
COMMENT ON TABLE cash_bank_accounts IS 'Cash and bank accounts';
COMMENT ON TABLE cash_bank_transactions IS 'Transactions for cash/bank accounts';
COMMENT ON TABLE fixed_assets IS 'Fixed assets';
COMMENT ON TABLE asset_depreciation IS 'Depreciation records for assets';
COMMENT ON TABLE taxes IS 'Tax definitions';
COMMENT ON TABLE invoice_taxes IS 'Taxes applied to invoices';
COMMENT ON TABLE roles IS 'User roles';
COMMENT ON TABLE permissions IS 'System permissions';
COMMENT ON TABLE role_permissions IS 'Role-permission mapping';
COMMENT ON TABLE user_roles IS 'User-role mapping';
COMMENT ON TABLE audit_logs IS 'Audit trail logs';
COMMENT ON TABLE approvals IS 'Approval workflow records';
COMMENT ON TABLE period_locks IS 'Accounting period locks';
COMMENT ON TABLE financial_reports IS 'Saved financial report metadata';

-- Add check constraints and unique constraints for data integrity
ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS chk_account_type CHECK (type IN ('asset','liability','equity','revenue','expense'));
ALTER TABLE journal_lines ADD CONSTRAINT IF NOT EXISTS chk_debit_credit CHECK (debit >= 0 AND credit >= 0);
ALTER TABLE sales_invoices ADD CONSTRAINT IF NOT EXISTS chk_sales_invoice_total CHECK (total >= 0);
ALTER TABLE purchase_invoices ADD CONSTRAINT IF NOT EXISTS chk_purchase_invoice_total CHECK (total >= 0);
ALTER TABLE customer_payments ADD CONSTRAINT IF NOT EXISTS chk_customer_payment_amount CHECK (amount >= 0);
ALTER TABLE supplier_payments ADD CONSTRAINT IF NOT EXISTS chk_supplier_payment_amount CHECK (amount >= 0);
ALTER TABLE inventory_movements ADD CONSTRAINT IF NOT EXISTS chk_inventory_quantity CHECK (quantity >= 0);
ALTER TABLE payrolls ADD CONSTRAINT IF NOT EXISTS chk_gross_net_salary CHECK (gross_salary >= 0 AND net_salary >= 0);
ALTER TABLE cash_bank_transactions ADD CONSTRAINT IF NOT EXISTS chk_cash_bank_amount CHECK (amount >= 0);
ALTER TABLE fixed_assets ADD CONSTRAINT IF NOT EXISTS chk_asset_cost CHECK (cost >= 0);
ALTER TABLE taxes ADD CONSTRAINT IF NOT EXISTS chk_tax_rate CHECK (rate >= 0);

-- Add triggers for updated_at (example for companies, repeat for others as needed)
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
    'companies','accounts','journal_entries','journal_lines','customers','sales_invoices','customer_payments','suppliers','purchase_invoices','supplier_payments','warehouses','products','inventory_movements','employees','payrolls','cash_bank_accounts','cash_bank_transactions','fixed_assets','asset_depreciation','taxes','invoice_taxes','roles','permissions','role_permissions','user_roles','audit_logs','approvals','period_locks','financial_reports'
  ) LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at();', r.tablename);
  END LOOP;
END $$;
