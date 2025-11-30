-- ═══════════════════════════════════════════════════════════════════════════
-- RBAC Tables Migration
-- ═══════════════════════════════════════════════════════════════════════════
-- This script creates the necessary tables for the RBAC system
-- Run this before executing the seedRBAC.js script
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    scope ENUM('global', 'tenant', 'public') NOT NULL DEFAULT 'tenant',
    description TEXT,
    hierarchy_level INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_roles_role_name (role_name),
    INDEX idx_roles_scope (scope),
    INDEX idx_roles_is_active (is_active),
    INDEX idx_roles_hierarchy_level (hierarchy_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_permissions_permission_name (permission_name),
    INDEX idx_permissions_resource (resource),
    INDEX idx_permissions_action (action),
    INDEX idx_permissions_is_active (is_active),
    UNIQUE INDEX idx_permissions_resource_action (resource, action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    UNIQUE INDEX idx_role_permissions_unique (role_id, permission_id),
    INDEX idx_role_permissions_role_id (role_id),
    INDEX idx_role_permissions_permission_id (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Modify users table to add role_id foreign key
-- First, add the role_id column (nullable initially)
ALTER TABLE users 
ADD COLUMN role_id INT NULL AFTER tenant_id;

-- Add foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_role_id 
FOREIGN KEY (role_id) REFERENCES roles(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Add index for performance
ALTER TABLE users 
ADD INDEX idx_users_role_id (role_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- DATA MIGRATION (if you have existing users with old role field)
-- ═══════════════════════════════════════════════════════════════════════════
-- IMPORTANT: Run the seedRBAC.js script first to populate the roles table!
-- Then run this section to migrate existing user data:

-- Map existing role strings to new role_id
-- Uncomment these after running the seeder:

-- UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'super_admin') WHERE role = 'super_admin';
-- UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'admin') WHERE role = 'admin';
-- UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'manager') WHERE role = 'manager';
-- UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'project_manager') WHERE role = 'project_manager';
-- UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'volunteer') WHERE role = 'volunteer';
-- UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'donor') WHERE role IN ('doner', 'donor');
-- UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'tenant_owner') WHERE role IN ('ngo_manager', 'tenant_owner');

-- After migration is complete and verified, optionally drop the old role column:
-- ALTER TABLE users DROP COLUMN role;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if tables were created successfully:
-- SHOW TABLES LIKE '%role%';
-- SHOW TABLES LIKE '%permission%';

-- Check table structure:
-- DESCRIBE roles;
-- DESCRIBE permissions;
-- DESCRIBE role_permissions;
-- DESCRIBE users;

-- After running the seeder, verify data:
-- SELECT * FROM roles ORDER BY hierarchy_level DESC;
-- SELECT COUNT(*) as total_permissions FROM permissions;
-- SELECT r.role_name, COUNT(rp.permission_id) as permission_count 
-- FROM roles r 
-- LEFT JOIN role_permissions rp ON r.id = rp.role_id 
-- GROUP BY r.id, r.role_name 
-- ORDER BY r.hierarchy_level DESC;
