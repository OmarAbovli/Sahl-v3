-- Add debt management tables

-- Debts table to track outstanding debts
CREATE TABLE IF NOT EXISTS debts (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    debtor_name VARCHAR(255) NOT NULL, -- Company or individual name
    debtor_type VARCHAR(50) DEFAULT 'individual', -- 'individual' or 'company'
    debtor_contact VARCHAR(255), -- Phone, email, or address
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE SET NULL,
    original_amount DECIMAL(12, 2) NOT NULL,
    remaining_amount DECIMAL(12, 2) NOT NULL,
    sale_date DATE NOT NULL,
    due_date DATE,
    last_payment_date DATE,
    last_payment_amount DECIMAL(12, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'paid', 'overdue', 'written_off'
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Debt payments table to track payment history
CREATE TABLE IF NOT EXISTS debt_payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    debt_id INTEGER REFERENCES debts(id) ON DELETE CASCADE,
    payment_amount DECIMAL(12, 2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(100), -- 'cash', 'check', 'bank_transfer', 'card', etc.
    reference_number VARCHAR(100), -- Check number, transaction ID, etc.
    notes TEXT,
    recorded_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_debts_company_id ON debts(company_id);
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON debts(due_date);
CREATE INDEX IF NOT EXISTS idx_debt_payments_company_id ON debt_payments(company_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);

-- Apply updated_at trigger to debts table
CREATE TRIGGER update_debts_updated_at BEFORE UPDATE ON debts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add a function to automatically update debt status based on remaining amount
CREATE OR REPLACE FUNCTION update_debt_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on remaining amount and due date
    IF NEW.remaining_amount <= 0 THEN
        NEW.status = 'paid';
    ELSIF NEW.due_date < CURRENT_DATE AND NEW.remaining_amount > 0 THEN
        NEW.status = 'overdue';
    ELSE
        NEW.status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update debt status
CREATE TRIGGER update_debt_status_trigger 
    BEFORE INSERT OR UPDATE ON debts 
    FOR EACH ROW EXECUTE FUNCTION update_debt_status();

-- Add some sample data for testing (optional)
-- This will be populated when users create actual debt sales
