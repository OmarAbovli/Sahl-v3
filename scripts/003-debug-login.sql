-- Debug script to check user authentication
-- Run this to verify the super admin user exists and is properly configured

SELECT 
    id,
    unique_key,
    email,
    role,
    is_active,
    expires_at,
    created_at,
    CASE 
        WHEN expires_at IS NULL THEN 'Never expires'
        WHEN expires_at > NOW() THEN 'Valid'
        ELSE 'Expired'
    END as expiration_status
FROM users 
WHERE unique_key = 'superadmin001';

-- Also check if there are any users in the system
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as super_admins FROM users WHERE role = 'super_admin';
