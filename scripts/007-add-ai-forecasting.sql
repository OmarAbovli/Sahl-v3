-- Add AI & Forecasting tables for advanced analytics

-- AI Reports table to store generated reports and forecasts
CREATE TABLE IF NOT EXISTS ai_reports (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    report_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    data_period_start DATE,
    data_period_end DATE,
    forecast_period_months INTEGER DEFAULT 3,
    analysis_data JSONB,
    results JSONB NOT NULL,
    insights JSONB,
    confidence_score DECIMAL(3,2) DEFAULT 0.75,
    generated_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Insights table for storing key business insights
CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    insight_type VARCHAR(50) NOT NULL, -- trend, alert, recommendation, anomaly
    category VARCHAR(50) NOT NULL, -- sales, inventory, debt, finance
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    data_source VARCHAR(100),
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Forecasting Models table to track different prediction models
CREATE TABLE IF NOT EXISTS forecasting_models (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL, -- 'linear_regression', 'seasonal', 'trend_analysis'
    target_metric VARCHAR(100) NOT NULL, -- 'sales', 'inventory_turnover', 'debt_collection'
    parameters JSONB NOT NULL, -- Model configuration
    accuracy_score DECIMAL(5,4), -- Model accuracy (0.0000 to 1.0000)
    last_trained TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Preferences table for language and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    language VARCHAR(10) DEFAULT 'en', -- 'en', 'ar'
    timezone VARCHAR(100) DEFAULT 'UTC',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    currency_format VARCHAR(10) DEFAULT 'USD',
    theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark'
    ai_insights_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}', -- Additional custom preferences
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comprehensive accounting tables
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    account_code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- asset, liability, equity, revenue, expense
    parent_account_id INTEGER REFERENCES chart_of_accounts(id),
    level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, account_code)
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    entry_number VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    total_debit DECIMAL(15,2) DEFAULT 0,
    total_credit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft', -- draft, posted, reversed
    created_by INTEGER REFERENCES users(id),
    posted_by INTEGER REFERENCES users(id),
    posted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, entry_number)
);

CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id SERIAL PRIMARY KEY,
    journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id INTEGER NOT NULL REFERENCES chart_of_accounts(id),
    description TEXT,
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    line_number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    customer_code VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30, -- days
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, customer_code)
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    supplier_code VARCHAR(20) NOT NULL,
    supplier_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    payment_terms INTEGER DEFAULT 30, -- days
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, supplier_code)
);

CREATE TABLE IF NOT EXISTS sales_invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    invoice_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS sales_invoice_lines (
    id SERIAL PRIMARY KEY,
    sales_invoice_id INTEGER NOT NULL REFERENCES sales_invoices(id) ON DELETE CASCADE,
    inventory_item_id INTEGER REFERENCES inventory(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    line_number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS purchase_invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    invoice_number VARCHAR(50) NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, invoice_number)
);

CREATE TABLE IF NOT EXISTS purchase_invoice_lines (
    id SERIAL PRIMARY KEY,
    purchase_invoice_id INTEGER NOT NULL REFERENCES purchase_invoices(id) ON DELETE CASCADE,
    inventory_item_id INTEGER REFERENCES inventory(id),
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    line_total DECIMAL(15,2) NOT NULL,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    line_number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    payment_number VARCHAR(50) NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- cash, bank, cheque, card
    reference VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, payment_number)
);

CREATE TABLE IF NOT EXISTS supplier_payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    payment_number VARCHAR(50) NOT NULL,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    payment_method VARCHAR(50), -- cash, bank, cheque, card
    reference VARCHAR(100),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, payment_number)
);

CREATE TABLE IF NOT EXISTS hr_employees (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    employee_code VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    hire_date DATE NOT NULL,
    job_title VARCHAR(100),
    department VARCHAR(100),
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, employee_code)
);

CREATE TABLE IF NOT EXISTS payroll_records (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id),
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances DECIMAL(15,2) DEFAULT 0,
    deductions DECIMAL(15,2) DEFAULT 0,
    gross_pay DECIMAL(15,2) NOT NULL,
    tax_deduction DECIMAL(15,2) DEFAULT 0,
    net_pay DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft', -- draft, approved, paid
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'checking', -- checking, savings, credit
    current_balance DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    bank_account_id INTEGER NOT NULL REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(100),
    debit_amount DECIMAL(15,2) DEFAULT 0,
    credit_amount DECIMAL(15,2) DEFAULT 0,
    balance DECIMAL(15,2) NOT NULL,
    transaction_type VARCHAR(50), -- deposit, withdrawal, transfer, fee
    is_reconciled BOOLEAN DEFAULT FALSE,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fixed_assets (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    asset_code VARCHAR(20) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_category VARCHAR(100),
    purchase_date DATE NOT NULL,
    purchase_cost DECIMAL(15,2) NOT NULL,
    useful_life_years INTEGER NOT NULL,
    depreciation_method VARCHAR(50) DEFAULT 'straight_line', -- straight_line, declining_balance
    accumulated_depreciation DECIMAL(15,2) DEFAULT 0,
    book_value DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, disposed, sold
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, asset_code)
);

CREATE TABLE IF NOT EXISTS tax_settings (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id),
    tax_name VARCHAR(100) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_type VARCHAR(50) NOT NULL, -- vat, gst, sales_tax
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_reports_company_id ON ai_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_company_id ON ai_insights(company_id);
CREATE INDEX IF NOT EXISTS idx_chart_of_accounts_company_id ON chart_of_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_company_id ON journal_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoices_company_id ON sales_invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_company_id ON purchase_invoices(company_id);

-- Apply updated_at triggers
CREATE TRIGGER update_ai_reports_updated_at BEFORE UPDATE ON ai_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forecasting_models_updated_at BEFORE UPDATE ON forecasting_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default user preferences for existing users
INSERT INTO user_preferences (user_id, language, ai_insights_enabled)
SELECT id, 'en', true FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Insert default chart of accounts
INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, level) 
SELECT 1, '1000', 'Assets', 'asset', 1 WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1000');

INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, parent_account_id, level) 
SELECT 1, '1100', 'Current Assets', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1000' LIMIT 1), 2 
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1100');

INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, parent_account_id, level) 
SELECT 1, '1110', 'Cash', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1), 3 
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1110');

INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, parent_account_id, level) 
SELECT 1, '1120', 'Accounts Receivable', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1), 3 
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1120');

INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type, parent_account_id, level) 
SELECT 1, '1130', 'Inventory', 'asset', (SELECT id FROM chart_of_accounts WHERE account_code = '1100' LIMIT 1), 3 
WHERE NOT EXISTS (SELECT 1 FROM chart_of_accounts WHERE account_code = '1130');

-- Sample AI insights for demonstration
INSERT INTO ai_insights (company_id, insight_type, category, title, description, severity, data_source, metadata)
SELECT 
    c.id,
    'recommendation',
    'inventory',
    'Low Stock Alert',
    'Several items are running low on stock and may need restocking soon.',
    'medium',
    'inventory_analysis',
    '{"items_count": 5, "avg_days_remaining": 7}'
FROM companies c
WHERE c.is_active = true
ON CONFLICT DO NOTHING;
