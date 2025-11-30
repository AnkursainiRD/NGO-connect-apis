/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RBAC Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Role-Based Access Control (RBAC) middleware for authorization.
 * Provides role hierarchy checking, permission validation, and organization isolation.
 * 
 * @module api/middlewares/rbac
 */

import { User, Role, Permission } from '#models/index.js';
import createError from 'http-errors';

/**
 * Role hierarchy mapping (higher number = more privileges)
 */
const ROLE_HIERARCHY = {
  super_admin: 7,
  org_owner: 6,
  admin: 5,
  manager: 4,
  project_manager: 3,
  volunteer: 2,
  donor: 1,
};

/**
 * Middleware to check if user has a specific role
 * @param {string|string[]} requiredRoles - Role name(s) required
 * @returns {Function} Express middleware
 */
export const requireRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      // Load user with role and permissions
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] }, // Exclude junction table attributes
              },
            ],
          },
        ],
      });

      if (!user) {
        throw createError(404, 'User not found');
      }

      if (!user.role) {
        throw createError(403, 'User has no assigned role');
      }

      // Normalize to array
      const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];

      // Check if user has any of the required roles
      const hasRole = roles.includes(user.role.role_name);

      if (!hasRole) {
        throw createError(
          403,
          `Access denied. Required role(s): ${roles.join(', ')}`
        );
      }

      // Attach user with role to request object
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has a role with hierarchy level >= required role
 * @param {string} minimumRole - Minimum role name required
 * @returns {Function} Express middleware
 */
export const requireRoleOrHigher = (minimumRole) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      // Load user with role and permissions
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!user) {
        throw createError(404, 'User not found');
      }

      if (!user.role) {
        throw createError(403, 'User has no assigned role');
      }

      // Get hierarchy levels
      const userLevel = ROLE_HIERARCHY[user.role.role_name] || 0;
      const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

      if (userLevel < requiredLevel) {
        throw createError(
          403,
          `Access denied. Minimum required role: ${minimumRole}`
        );
      }

      // Attach user with role to request object
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has a specific permission
 * @param {string|string[]} requiredPermissions - Permission name(s) required (e.g., 'users.create')
 * @returns {Function} Express middleware
 */
export const requirePermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      // Load user with role and permissions
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!user) {
        throw createError(404, 'User not found');
      }

      if (!user.role) {
        throw createError(403, 'User has no assigned role');
      }

      // Normalize to array
      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      // Get user's permission names
      const userPermissions = user.role.permissions?.map((p) => p.permission_name) || [];

      // Check if user has all required permissions
      const hasAllPermissions = permissions.every((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasAllPermissions) {
        throw createError(
          403,
          `Access denied. Required permission(s): ${permissions.join(', ')}`
        );
      }

      // Attach user with role to request object
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has ANY of the specified permissions
 * @param {string[]} permissions - Array of permission names
 * @returns {Function} Express middleware
 */
export const requireAnyPermission = (permissions) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      // Load user with role and permissions
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!user) {
        throw createError(404, 'User not found');
      }

      if (!user.role) {
        throw createError(403, 'User has no assigned role');
      }

      // Get user's permission names
      const userPermissions = user.role.permissions?.map((p) => p.permission_name) || [];

      // Check if user has at least one of the required permissions
      const hasAnyPermission = permissions.some((perm) =>
        userPermissions.includes(perm)
      );

      if (!hasAnyPermission) {
        throw createError(
          403,
          `Access denied. Required at least one of: ${permissions.join(', ')}`
        );
      }

      // Attach user with role to request object
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to ensure user can only access their own organization data
 * @param {string} [orgIdParam='orgId'] - Request parameter name for organization ID
 * @returns {Function} Express middleware
 */
export const requireOrgAccess = (orgIdParam = 'orgId') => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      // Load user with role
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'role',
          },
        ],
      });

      if (!user) {
        throw createError(404, 'User not found');
      }

      if (!user.role) {
        throw createError(403, 'User has no assigned role');
      }

      // Super admins can access all organizations
      if (user.role.role_name === 'super_admin') {
        req.user = user;
        return next();
      }

      // Get org ID from request (params, body, or query)
      const requestedOrgId =
        req.params[orgIdParam] ||
        req.body?.org_id ||
        req.query?.org_id;

      // Check if user's org matches the requested org
      if (!user.org_id) {
        throw createError(403, 'User is not associated with any organization');
      }

      if (String(user.org_id) !== String(requestedOrgId)) {
        throw createError(403, 'Access denied. Cannot access other organization data');
      }

      // Attach user with role to request object
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user is a super admin
 * @returns {Function} Express middleware
 */
export const requireSuperAdmin = () => {
  return requireRole('super_admin');
};

/**
 * Middleware to check if user is an organization owner
 * @returns {Function} Express middleware
 */
export const requireOrgOwner = () => {
  return requireRole('org_owner');
};

/**
 * Middleware to check if user is at least an admin
 * @returns {Function} Express middleware
 */
export const requireAdmin = () => {
  return requireRoleOrHigher('admin');
};

/**
 * Middleware to check if user is at least a manager
 * @returns {Function} Express middleware
 */
export const requireManager = () => {
  return requireRoleOrHigher('manager');
};

/**
 * Combined middleware: Check role/permission AND org access
 * @param {Object} options - Options object
 * @param {string|string[]} [options.roles] - Required role(s)
 * @param {string|string[]} [options.permissions] - Required permission(s)
 * @param {boolean} [options.checkOrg=true] - Whether to check org access
 * @param {string} [options.orgIdParam='orgId'] - Org ID parameter name
 * @returns {Function} Express middleware
 */
export const authorize = (options = {}) => {
  const {
    roles,
    permissions,
    checkOrg = true,
    orgIdParam = 'orgId',
  } = options;

  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw createError(401, 'Authentication required');
      }

      // Load user with role and permissions
      const user = await User.findByPk(req.user.id, {
        include: [
          {
            model: Role,
            as: 'role',
            include: [
              {
                model: Permission,
                as: 'permissions',
                through: { attributes: [] },
              },
            ],
          },
        ],
      });

      if (!user) {
        throw createError(404, 'User not found');
      }

      if (!user.role) {
        throw createError(403, 'User has no assigned role');
      }

      // Check roles if specified
      if (roles) {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        const hasRole = roleArray.includes(user.role.role_name);

        if (!hasRole) {
          throw createError(
            403,
            `Access denied. Required role(s): ${roleArray.join(', ')}`
          );
        }
      }

      // Check permissions if specified
      if (permissions) {
        const permArray = Array.isArray(permissions) ? permissions : [permissions];
        const userPermissions = user.role.permissions?.map((p) => p.permission_name) || [];
        const hasAllPermissions = permArray.every((perm) =>
          userPermissions.includes(perm)
        );

        if (!hasAllPermissions) {
          throw createError(
            403,
            `Access denied. Required permission(s): ${permArray.join(', ')}`
          );
        }
      }

      // Check org access if specified
      if (checkOrg && user.role.role_name !== 'super_admin') {
        const requestedOrgId =
          req.params[orgIdParam] ||
          req.body?.org_id ||
          req.query?.org_id;

        if (!user.org_id) {
          throw createError(403, 'User is not associated with any organization');
        }

        if (requestedOrgId && String(user.org_id) !== String(requestedOrgId)) {
          throw createError(403, 'Access denied. Cannot access other organization data');
        }
      }

      // Attach user with role to request object
      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Default export
 */
export default {
  requireRole,
  requireRoleOrHigher,
  requirePermission,
  requireAnyPermission,
  requireOrgAccess,
  requireSuperAdmin,
  requireOrgOwner,
  requireAdmin,
  requireManager,
  authorize,
};
