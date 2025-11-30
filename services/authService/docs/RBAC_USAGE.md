# RBAC Middleware Usage Guide

This guide demonstrates how to use the RBAC middleware in your routes.

## Basic Usage

### 1. Import the middleware

```javascript
import {
  requireRole,
  requireRoleOrHigher,
  requirePermission,
  requireAnyPermission,
  requireTenantAccess,
  requireSuperAdmin,
  requireAdmin,
  requireManager,
  authorize,
} from '#api/middlewares/index.js';
```

### 2. Protect routes with role-based access

```javascript
// Require exact role
router.get('/admin-only', requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin only route' });
});

// Require one of multiple roles
router.get('/staff-only', requireRole(['admin', 'manager']), (req, res) => {
  res.json({ message: 'Staff only route' });
});

// Require role with hierarchy (admin or higher)
router.get('/management', requireRoleOrHigher('admin'), (req, res) => {
  res.json({ message: 'Requires admin or higher (super_admin, tenant_owner)' });
});
```

### 3. Protect routes with permission-based access

```javascript
// Require specific permission
router.post('/users', requirePermission('users.create'), async (req, res) => {
  // Create user logic
});

// Require multiple permissions (user must have ALL)
router.put('/users/:id', requirePermission(['users.update', 'users.manage']), async (req, res) => {
  // Update user logic
});

// Require any of the specified permissions (user must have AT LEAST ONE)
router.get('/reports', requireAnyPermission(['reports.read', 'reports.manage']), async (req, res) => {
  // View reports logic
});
```

### 4. Enforce tenant isolation

```javascript
// Ensure user can only access their own tenant data
router.get('/tenants/:tenantId/projects', requireTenantAccess('tenantId'), async (req, res) => {
  // Only users from this tenant (or super_admin) can access
  const projects = await Project.findAll({ where: { tenant_id: req.params.tenantId } });
  res.json(projects);
});
```

### 5. Combined authorization (recommended)

```javascript
// Combine role, permission, and tenant checks
router.put(
  '/tenants/:tenantId/projects/:projectId',
  authorize({
    roles: ['admin', 'manager'],
    permissions: ['projects.update'],
    checkTenant: true,
    tenantIdParam: 'tenantId',
  }),
  async (req, res) => {
    // Update project logic
  }
);

// Permission-only check without tenant validation
router.get(
  '/global-stats',
  authorize({
    permissions: ['reports.read'],
    checkTenant: false,
  }),
  async (req, res) => {
    // View global statistics
  }
);
```

### 6. Convenience methods

```javascript
// Super admin only
router.delete('/tenants/:id', requireSuperAdmin(), async (req, res) => {
  // Delete tenant logic
});

// Admin or higher (includes super_admin, tenant_owner)
router.post('/users', requireAdmin(), async (req, res) => {
  // Create user logic
});

// Manager or higher
router.get('/team', requireManager(), async (req, res) => {
  // View team logic
});
```

## Complete Route Example

```javascript
import express from 'express';
import {
  requireAuth,
  requireRole,
  requirePermission,
  authorize,
} from '#api/middlewares/index.js';

const router = express.Router();

// Public route - no auth required
router.get('/public/projects', async (req, res) => {
  // Public projects
});

// Authenticated route - any logged-in user
router.get('/profile', requireAuth, async (req, res) => {
  res.json(req.user);
});

// Role-based route
router.get('/volunteers', requireRole('manager'), async (req, res) => {
  // List volunteers
});

// Permission-based route
router.post('/projects', requirePermission('projects.create'), async (req, res) => {
  // Create project
});

// Combined authorization with tenant isolation
router.put(
  '/tenants/:tenantId/projects/:id',
  authorize({
    permissions: ['projects.update'],
    checkTenant: true,
  }),
  async (req, res) => {
    // Update project
  }
);

export default router;
```

## Role Hierarchy

The system uses a hierarchical role structure (highest to lowest):

1. **super_admin** (level 7) - Global scope
2. **tenant_owner** (level 6) - Tenant scope
3. **admin** (level 5) - Tenant scope
4. **manager** (level 4) - Tenant scope
5. **project_manager** (level 3) - Tenant scope
6. **volunteer** (level 2) - Tenant scope
7. **donor** (level 1) - Public scope

### Using Hierarchy

```javascript
// This allows manager, admin, tenant_owner, and super_admin
router.get('/reports', requireRoleOrHigher('manager'), handler);

// Only exact role match
router.get('/donations', requireRole('donor'), handler);
```

## Permission Naming Convention

Permissions follow the pattern: `{resource}.{action}`

**Resources:**
- users
- projects
- volunteers
- donations
- tasks
- tenants
- reports
- settings

**Actions:**
- create
- read
- update
- delete
- list
- manage (full control)
- assign (for tasks/projects)
- approve (for reviews)

**Examples:**
- `users.create`
- `projects.manage`
- `volunteers.assign`
- `reports.read`

## Accessing User Data in Routes

After authentication and authorization, the user object is available on `req.user`:

```javascript
router.get('/my-projects', requireAuth, async (req, res) => {
  const user = req.user; // Full user object with role and permissions
  
  console.log(user.id);
  console.log(user.email);
  console.log(user.role.role_name);
  console.log(user.role.permissions);
  
  // Use helper methods
  const hasPermission = await user.hasPermission('projects.create');
  const isAdmin = await user.hasRole('admin');
  const permissions = await user.getPermissions();
});
```

## Error Handling

The RBAC middleware throws HTTP errors with appropriate status codes:

- **401 Unauthorized** - No authentication token or invalid token
- **403 Forbidden** - Insufficient permissions or wrong role
- **404 Not Found** - User not found

These errors are caught by the global error handler middleware.

## Best Practices

1. **Always use requireAuth first** if you're using RBAC middleware
2. **Use `authorize()` for complex checks** instead of chaining multiple middleware
3. **Enable tenant checking** for tenant-scoped resources
4. **Use permission-based access** for fine-grained control
5. **Use role-based access** for simpler hierarchical access
6. **Super admins bypass tenant checks** automatically

## Running the Seeder

Before using RBAC, seed the database with roles and permissions:

```bash
node scripts/seedRBAC.js
```

This will create all 7 roles, their permissions, and the mappings between them.
