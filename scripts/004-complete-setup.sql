-- Complete setup script for the accounting application

-- First, ensure the super admin user is properly created
DELETE FROM users WHERE unique_key = 'superadmin001';

-- Insert super admin with a fresh password hash
-- Password: SuperAdmin123!
INSERT INTO users (unique_key, email, password_hash, role, expires_at, is_active, permissions)
VALUES (
    'superadmin001',
    'admin@system.com',
    '$2b$12$LQv3c1yqBwEHxv03kpDOCOHgn.1L5YduQXqvCwuBpMGprifbgJ/FG',
    'super_admin',
    '2025-12-31 23:59:59'::timestamp,
    true,
    '{}'::jsonb
);

-- Verify the user was created correctly
SELECT 
    'Super Admin User Created' as status,
    unique_key,
    email,
    role,
    is_active,
    expires_at > NOW() as not_expired
FROM users 
WHERE unique_key = 'superadmin001';

-- Create a test company for demonstration
INSERT INTO companies (name, display_name, is_active)
VALUES ('demo', 'Demo Company', true)
ON CONFLICT (name) DO NOTHING;

-- Show summary
SELECT 'Setup Complete' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_companies FROM companies;
