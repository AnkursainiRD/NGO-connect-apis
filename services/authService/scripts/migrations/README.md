# RBAC Database Migration Guide

This directory contains SQL migration scripts to set up the RBAC (Role-Based Access Control) system.

## Files

- `create_rbac_tables.sql` - MySQL/MariaDB migration script
- `create_rbac_tables_postgres.sql` - PostgreSQL migration script

## Migration Steps

### Step 1: Run the SQL Migration

Choose the appropriate SQL file based on your database:

**For MySQL/MariaDB:**
```bash
mysql -u your_username -p your_database < scripts/migrations/create_rbac_tables.sql
```

**For PostgreSQL:**
```bash
psql -U your_username -d your_database -f scripts/migrations/create_rbac_tables_postgres.sql
```

**Or manually execute:**
1. Open your database client (MySQL Workbench, pgAdmin, DBeaver, etc.)
2. Connect to your database
3. Open the appropriate SQL file
4. Execute the entire script

### Step 2: Verify Tables Were Created

Run these queries to verify:

```sql
-- Check tables exist
SHOW TABLES LIKE '%role%';
SHOW TABLES LIKE '%permission%';

-- Or for PostgreSQL:
-- \dt *role*
-- \dt *permission*

-- Verify structure
DESCRIBE roles;
DESCRIBE permissions;
DESCRIBE role_permissions;
DESCRIBE users;
```

### Step 3: Seed the Database

Run the seeder script to populate roles and permissions:

```bash
node scripts/seedRBAC.js
```

This will create:
- 7 roles (super_admin, tenant_owner, admin, manager, project_manager, volunteer, donor)
- 60+ permissions
- Role-permission mappings

### Step 4: Verify Seeded Data

```sql
-- Check roles
SELECT * FROM roles ORDER BY hierarchy_level DESC;

-- Check permissions count
SELECT COUNT(*) as total_permissions FROM permissions;

-- Check role-permission mappings
SELECT r.role_name, COUNT(rp.permission_id) as permission_count 
FROM roles r 
LEFT JOIN role_permissions rp ON r.id = rp.role_id 
GROUP BY r.id, r.role_name 
ORDER BY r.hierarchy_level DESC;
```

### Step 5: Migrate Existing User Data (Optional)

If you have existing users with the old `role` string field, migrate them:

1. **First**, seed the roles (Step 3 above)
2. **Then**, uncomment and run the UPDATE statements in the migration file:

```sql
UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'super_admin') WHERE role = 'super_admin';
UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'admin') WHERE role = 'admin';
UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'manager') WHERE role = 'manager';
UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'project_manager') WHERE role = 'project_manager';
UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'volunteer') WHERE role = 'volunteer';
UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'donor') WHERE role IN ('doner', 'donor');
UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'tenant_owner') WHERE role IN ('ngo_manager', 'tenant_owner');
```

3. **Verify** all users have been migrated:

```sql
-- Check for users without role_id
SELECT id, email, role, role_id FROM users WHERE role_id IS NULL;

-- Compare old and new roles
SELECT role, r.role_name, COUNT(*) as count 
FROM users u 
LEFT JOIN roles r ON u.role_id = r.id 
GROUP BY role, r.role_name;
```

4. **After verification**, optionally drop the old `role` column:

```sql
ALTER TABLE users DROP COLUMN role;
```

## Tables Created

### 1. `roles` Table

Stores role definitions with hierarchy levels.

| Column | Type | Description |
|--------|------|-------------|
| id | INT/SERIAL | Primary key |
| role_name | VARCHAR(50) | Unique role identifier |
| scope | ENUM | Role scope (global/tenant/public) |
| description | TEXT | Role description |
| hierarchy_level | INT | Hierarchy level (1-7) |
| is_active | BOOLEAN | Active status |

### 2. `permissions` Table

Stores granular permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | INT/SERIAL | Primary key |
| permission_name | VARCHAR(100) | Unique permission (e.g., 'users.create') |
| resource | VARCHAR(50) | Resource type (e.g., 'users') |
| action | VARCHAR(50) | Action type (e.g., 'create') |
| description | TEXT | Permission description |
| is_active | BOOLEAN | Active status |

### 3. `role_permissions` Table

Junction table for role-permission relationships.

| Column | Type | Description |
|--------|------|-------------|
| id | INT/SERIAL | Primary key |
| role_id | INT | Foreign key to roles |
| permission_id | INT | Foreign key to permissions |

### 4. `users` Table Modification

Added `role_id` column to replace the old `role` string field.

| Column | Type | Description |
|--------|------|-------------|
| role_id | INT | Foreign key to roles (nullable) |

## Rollback

If you need to rollback the migration:

```sql
-- Drop foreign key constraint from users
ALTER TABLE users DROP FOREIGN KEY fk_users_role_id;
ALTER TABLE users DROP INDEX idx_users_role_id;
ALTER TABLE users DROP COLUMN role_id;

-- Drop RBAC tables
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

-- For PostgreSQL, also drop the enum type:
-- DROP TYPE IF EXISTS scope_type;
```

## Troubleshooting

### Error: Table already exists
- The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to re-run
- Check if tables were partially created and drop them manually if needed

### Error: Foreign key constraint fails
- Make sure you're running the seeder AFTER creating the tables
- Verify the roles table is populated before updating users

### Error: Column role_id doesn't exist
- Ensure you ran the ALTER TABLE statement for users
- Check if the column exists: `SHOW COLUMNS FROM users LIKE 'role_id';`

## Support

For more information, see:
- [RBAC Usage Guide](../../docs/RBAC_USAGE.md)
- [Implementation Walkthrough](../../../.gemini/antigravity/brain/9138cc94-4bab-4463-a064-cc793c9185be/walkthrough.md)
