-- First, let's check if the user already exists and delete it if it does
DELETE FROM users WHERE unique_key = 'superadmin001';

-- Create initial super admin user
-- Password: SuperAdmin123! (hashed with bcrypt)
INSERT INTO users (unique_key, email, password_hash, role, expires_at, is_active)
VALUES (
    'superadmin001',
    'admin@system.com',
    '$2b$12$LQv3c1yqBwEHxv03kpDOCOHgn.1L5YduQXqvCwuBpMGprifbgJ/FG',
    'super_admin',
    '2025-12-31 23:59:59',
    true
);

-- Verify the user was created
SELECT unique_key, email, role, is_active, expires_at FROM users WHERE unique_key = 'superadmin001';
