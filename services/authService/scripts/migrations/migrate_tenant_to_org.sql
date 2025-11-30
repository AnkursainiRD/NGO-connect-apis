-- ═══════════════════════════════════════════════════════════════════════════
-- Tenant to Org Migration Script (FIXED)
-- ═══════════════════════════════════════════════════════════════════════════
-- This script renames all tenant-related columns and values to org
-- Run this BEFORE running the seedRBAC.js script
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Modify ENUM to include BOTH 'tenant' and 'org' temporarily
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE roles MODIFY COLUMN scope ENUM('global', 'tenant', 'org', 'public') NOT NULL DEFAULT 'org';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Update existing data
-- ═══════════════════════════════════════════════════════════════════════════

-- Update scope values from 'tenant' to 'org'
UPDATE roles SET scope = 'org' WHERE scope = 'tenant';

-- Update role names from 'tenant_owner' to 'org_owner'
UPDATE roles SET role_name = 'org_owner' WHERE role_name = 'tenant_owner';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Remove 'tenant' from ENUM (optional - keeps only 'org')
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE roles MODIFY COLUMN scope ENUM('global', 'org', 'public') NOT NULL DEFAULT 'org'
COMMENT 'Scope of the role: global (platform-wide), org (NGO-specific), public (limited access)';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Update users table - rename tenant_id to org_id
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if column exists before renaming
ALTER TABLE users CHANGE COLUMN tenant_id org_id BIGINT NULL 
COMMENT 'Organization ID for multi-tenancy';

-- Drop old index and create new one
ALTER TABLE users DROP INDEX IF EXISTS idx_users_tenant_id;
ALTER TABLE users ADD INDEX idx_users_org_id (org_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Update user_activity_logs table - rename tenant_id to org_id  
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if the table and column exist
ALTER TABLE user_activity_logs CHANGE COLUMN tenant_id org_id BIGINT NULL 
COMMENT 'Organization ID for multi-tenancy';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 6: Update permissions table - change resource from 'tenants' to 'organizations'
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE permissions SET 
    resource = 'organizations',
    permission_name = REPLACE(permission_name, 'tenants', 'organizations'),
    description = REPLACE(description, 'tenant', 'organization')
WHERE resource = 'tenants';

-- ═══════════════════════════════════════════════════════════════════════════
-- Verification queries
-- ═══════════════════════════════════════════════════════════════════════════

-- Check roles table
SELECT * FROM roles ORDER BY hierarchy_level DESC;

-- Check users table structure
DESCRIBE users;

-- Check user_activity_logs table structure  
DESCRIBE user_activity_logs;

-- Check permissions
SELECT * FROM permissions WHERE resource = 'organizations';

-- Verify no tenant references remain
SELECT * FROM roles WHERE scope = 'tenant' OR role_name LIKE '%tenant%';
SELECT * FROM permissions WHERE resource = 'tenants' OR permission_name LIKE '%tenant%';
