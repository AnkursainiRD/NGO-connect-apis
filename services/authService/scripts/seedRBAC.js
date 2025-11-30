/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RBAC Seeder Script
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Seeds the database with initial roles, permissions, and role-permission mappings.
 * Run this script after database migration to set up the RBAC system.
 * 
 * Usage: node scripts/seedRBAC.js
 */

import { Role, Permission, RolePermission, sequelize } from '../src/core/models/index.js';

/**
 * Role definitions with hierarchy levels
 */
const roles = [
  {
    role_name: 'super_admin',
    scope: 'global',
    description: 'Full system/platform control with access to all organizations',
    hierarchy_level: 7,
    is_active: true,
  },
  {
    role_name: 'org_owner',
    scope: 'org',
    description: 'Organization creator with full rights within their organization',
    hierarchy_level: 6,
    is_active: true,
  },
  {
    role_name: 'admin',
    scope: 'org',
    description: 'Organization management rights with administrative capabilities',
    hierarchy_level: 5,
    is_active: true,
  },
  {
    role_name: 'manager',
    scope: 'org',
    description: 'Project and volunteer management capabilities',
    hierarchy_level: 4,
    is_active: true,
  },
  {
    role_name: 'project_manager',
    scope: 'org',
    description: 'Specific project control and task management',
    hierarchy_level: 3,
    is_active: true,
  },
  {
    role_name: 'volunteer',
    scope: 'org',
    description: 'Assigned work only, limited to assigned tasks and projects',
    hierarchy_level: 2,
    is_active: true,
  },
  {
    role_name: 'donor',
    scope: 'public',
    description: 'Donation capabilities and public access',
    hierarchy_level: 1,
    is_active: true,
  },
];

/**
 * Permission definitions
 * Format: resource.action
 */
const permissions = [
  // User management permissions
  { permission_name: 'users.create', resource: 'users', action: 'create', description: 'Create new users' },
  { permission_name: 'users.read', resource: 'users', action: 'read', description: 'View user details' },
  { permission_name: 'users.update', resource: 'users', action: 'update', description: 'Update user information' },
  { permission_name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { permission_name: 'users.list', resource: 'users', action: 'list', description: 'List all users' },
  { permission_name: 'users.manage', resource: 'users', action: 'manage', description: 'Full user management' },

  // Project management permissions
  { permission_name: 'projects.create', resource: 'projects', action: 'create', description: 'Create new projects' },
  { permission_name: 'projects.read', resource: 'projects', action: 'read', description: 'View project details' },
  { permission_name: 'projects.update', resource: 'projects', action: 'update', description: 'Update project information' },
  { permission_name: 'projects.delete', resource: 'projects', action: 'delete', description: 'Delete projects' },
  { permission_name: 'projects.list', resource: 'projects', action: 'list', description: 'List all projects' },
  { permission_name: 'projects.manage', resource: 'projects', action: 'manage', description: 'Full project management' },
  { permission_name: 'projects.assign', resource: 'projects', action: 'assign', description: 'Assign volunteers to projects' },

  // Volunteer management permissions
  { permission_name: 'volunteers.create', resource: 'volunteers', action: 'create', description: 'Create volunteer profiles' },
  { permission_name: 'volunteers.read', resource: 'volunteers', action: 'read', description: 'View volunteer details' },
  { permission_name: 'volunteers.update', resource: 'volunteers', action: 'update', description: 'Update volunteer information' },
  { permission_name: 'volunteers.delete', resource: 'volunteers', action: 'delete', description: 'Delete volunteer profiles' },
  { permission_name: 'volunteers.list', resource: 'volunteers', action: 'list', description: 'List all volunteers' },
  { permission_name: 'volunteers.manage', resource: 'volunteers', action: 'manage', description: 'Full volunteer management' },
  { permission_name: 'volunteers.assign', resource: 'volunteers', action: 'assign', description: 'Assign volunteers to tasks' },

  // Donation management permissions
  { permission_name: 'donations.create', resource: 'donations', action: 'create', description: 'Make donations' },
  { permission_name: 'donations.read', resource: 'donations', action: 'read', description: 'View donation details' },
  { permission_name: 'donations.update', resource: 'donations', action: 'update', description: 'Update donation information' },
  { permission_name: 'donations.list', resource: 'donations', action: 'list', description: 'List all donations' },
  { permission_name: 'donations.manage', resource: 'donations', action: 'manage', description: 'Full donation management' },

  // Task management permissions
  { permission_name: 'tasks.create', resource: 'tasks', action: 'create', description: 'Create new tasks' },
  { permission_name: 'tasks.read', resource: 'tasks', action: 'read', description: 'View task details' },
  { permission_name: 'tasks.update', resource: 'tasks', action: 'update', description: 'Update task information' },
  { permission_name: 'tasks.delete', resource: 'tasks', action: 'delete', description: 'Delete tasks' },
  { permission_name: 'tasks.list', resource: 'tasks', action: 'list', description: 'List all tasks' },
  { permission_name: 'tasks.assign', resource: 'tasks', action: 'assign', description: 'Assign tasks to volunteers' },

  // Organization management permissions
  { permission_name: 'organizations.create', resource: 'organizations', action: 'create', description: 'Create new organizations/NGOs' },
  { permission_name: 'organizations.read', resource: 'organizations', action: 'read', description: 'View organization details' },
  { permission_name: 'organizations.update', resource: 'organizations', action: 'update', description: 'Update organization information' },
  { permission_name: 'organizations.delete', resource: 'organizations', action: 'delete', description: 'Delete organizations' },
  { permission_name: 'organizations.list', resource: 'organizations', action: 'list', description: 'List all organizations' },
  { permission_name: 'organizations.manage', resource: 'organizations', action: 'manage', description: 'Full organization management' },

  // Report permissions
  { permission_name: 'reports.read', resource: 'reports', action: 'read', description: 'View reports' },
  { permission_name: 'reports.create', resource: 'reports', action: 'create', description: 'Generate reports' },
  { permission_name: 'reports.manage', resource: 'reports', action: 'manage', description: 'Full report management' },

  // Settings permissions
  { permission_name: 'settings.read', resource: 'settings', action: 'read', description: 'View settings' },
  { permission_name: 'settings.update', resource: 'settings', action: 'update', description: 'Update settings' },
  { permission_name: 'settings.manage', resource: 'settings', action: 'manage', description: 'Full settings management' },
];

/**
 * Role-Permission mappings
 * Define which permissions each role should have
 */
const rolePermissionMappings = {
  super_admin: [
    // Super admin has ALL permissions
    ...permissions.map(p => p.permission_name),
  ],
  org_owner: [
    // Org owner has full control within their organization
    'users.manage', 'users.create', 'users.read', 'users.update', 'users.delete', 'users.list',
    'projects.manage', 'projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.list', 'projects.assign',
    'volunteers.manage', 'volunteers.create', 'volunteers.read', 'volunteers.update', 'volunteers.delete', 'volunteers.list', 'volunteers.assign',
    'donations.manage', 'donations.create', 'donations.read', 'donations.update', 'donations.list',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete', 'tasks.list', 'tasks.assign',
    'organizations.read', 'organizations.update',
    'reports.manage', 'reports.create', 'reports.read',
    'settings.manage', 'settings.read', 'settings.update',
  ],
  admin: [
    // Admin has broad management rights
    'users.create', 'users.read', 'users.update', 'users.list',
    'projects.manage', 'projects.create', 'projects.read', 'projects.update', 'projects.delete', 'projects.list', 'projects.assign',
    'volunteers.manage', 'volunteers.create', 'volunteers.read', 'volunteers.update', 'volunteers.list', 'volunteers.assign',
    'donations.read', 'donations.update', 'donations.list',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete', 'tasks.list', 'tasks.assign',
    'organizations.read',
    'reports.create', 'reports.read',
    'settings.read', 'settings.update',
  ],
  manager: [
    // Manager can manage projects and volunteers
    'users.read', 'users.list',
    'projects.create', 'projects.read', 'projects.update', 'projects.list', 'projects.assign',
    'volunteers.create', 'volunteers.read', 'volunteers.update', 'volunteers.list', 'volunteers.assign',
    'donations.read', 'donations.list',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.list', 'tasks.assign',
    'organizations.read',
    'reports.read',
  ],
  project_manager: [
    // Project manager controls specific projects
    'users.read', 'users.list',
    'projects.read', 'projects.update', 'projects.list',
    'volunteers.read', 'volunteers.list', 'volunteers.assign',
    'donations.read',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.list', 'tasks.assign',
    'reports.read',
  ],
  volunteer: [
    // Volunteer has limited access
    'projects.read', 'projects.list',
    'volunteers.read',
    'tasks.read', 'tasks.update', 'tasks.list',
  ],
  donor: [
    // Donor can make donations and view public info
    'donations.create', 'donations.read',
    'projects.read', 'projects.list',
  ],
};

/**
 * Seed the database with roles, permissions, and mappings
 */
async function seedRBAC() {
  try {
    console.log('🌱 Starting RBAC seeding...');

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // 1. Seed Roles
      console.log('📝 Seeding roles...');
      const createdRoles = {};
      
      for (const roleData of roles) {
        const [role] = await Role.findOrCreate({
          where: { role_name: roleData.role_name },
          defaults: roleData,
          transaction,
        });
        createdRoles[role.role_name] = role;
        console.log(`  ✓ Created/found role: ${role.role_name}`);
      }

      // 2. Seed Permissions
      console.log('\n📝 Seeding permissions...');
      const createdPermissions = {};
      
      for (const permData of permissions) {
        const [permission] = await Permission.findOrCreate({
          where: { permission_name: permData.permission_name },
          defaults: permData,
          transaction,
        });
        createdPermissions[permission.permission_name] = permission;
        console.log(`  ✓ Created/found permission: ${permission.permission_name}`);
      }

      // 3. Seed Role-Permission Mappings
      console.log('\n📝 Seeding role-permission mappings...');
      
      for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
        const role = createdRoles[roleName];
        
        if (!role) {
          console.warn(`  ⚠ Role ${roleName} not found, skipping...`);
          continue;
        }

        console.log(`  Processing role: ${roleName}`);
        
        for (const permName of permissionNames) {
          const permission = createdPermissions[permName];
          
          if (!permission) {
            console.warn(`    ⚠ Permission ${permName} not found, skipping...`);
            continue;
          }

          await RolePermission.findOrCreate({
            where: {
              role_id: role.id,
              permission_id: permission.id,
            },
            defaults: {
              role_id: role.id,
              permission_id: permission.id,
            },
            transaction,
          });
        }
        
        console.log(`  ✓ Mapped ${permissionNames.length} permissions to ${roleName}`);
      }

      // Commit transaction
      await transaction.commit();

      console.log('\n✅ RBAC seeding completed successfully!');
      console.log(`\n📊 Summary:`);
      console.log(`  - Roles: ${Object.keys(createdRoles).length}`);
      console.log(`  - Permissions: ${Object.keys(createdPermissions).length}`);
      console.log(`  - Role-Permission mappings: Created`);

      process.exit(0);
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('\n❌ Error seeding RBAC:', error);
    process.exit(1);
  }
}

// Run the seeder
seedRBAC();
