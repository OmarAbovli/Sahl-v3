-- Direct database test and user recreation

-- First, let's see what's currently in the users table
SELECT 'Current users in database:' as info;
SELECT id, unique_key, email, role, is_active, expires_at, created_at 
FROM users 
ORDER BY created_at DESC;

-- Delete any existing super admin
DELETE FROM users WHERE unique_key = 'superadmin001' OR email = 'admin@system.com';

-- Create super admin with a simple, known hash
-- This hash is for password: "admin123" (simpler for testing)
INSERT INTO users (
    unique_key, 
    email, 
    password_hash, 
    role, 
    expires_at, 
    is_active,
    permissions,
    created_at,
    updated_at
) VALUES (
    'superadmin001',
    'admin@system.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    'super_admin',
    '2025-12-31 23:59:59'::timestamp,
    true,
    '{}'::jsonb,
    NOW(),
    NOW()
);

-- Verify the user was created
SELECT 'Newly created super admin:' as info;
SELECT 
    id,
    unique_key,
    email,
    role,
    is_active,
    expires_at,
    expires_at > NOW() as not_expired,
    created_at,
    length(password_hash) as password_hash_length
FROM users 
WHERE unique_key = 'superadmin001';

-- Test query that the login function uses
SELECT 'Login query test:' as info;
SELECT COUNT(*) as matching_users
FROM users 
WHERE unique_key = 'superadmin001' 
AND is_active = true 
AND (expires_at IS NULL OR expires_at > NOW());
