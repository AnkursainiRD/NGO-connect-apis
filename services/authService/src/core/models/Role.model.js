import { DataTypes, Model } from 'sequelize';
import sequelize from '#config/database.js';

/**
 * Role Model
 * Represents user roles in the RBAC system
 */
class Role extends Model {
  /**
   * Check if role is global scope
   * @returns {boolean}
   */
  isGlobalScope() {
    return this.scope === 'global';
  }

  /**
   * Check if role is tenant scope
   * @returns {boolean}
   */
  isTenantScope() {
    return this.scope === 'tenant';
  }

  /**
   * Check if role is public scope
   * @returns {boolean}
   */
  isPublicScope() {
    return this.scope === 'public';
  }

  /**
   * Define associations
   * @param {Object} models - All models
   */
  static associate(models) {
    // Role has many users
    this.hasMany(models.User, {
      foreignKey: 'role_id',
      as: 'users',
      onDelete: 'RESTRICT', // Prevent deletion if users exist
    });

    // Role has many permissions through RolePermission
    this.belongsToMany(models.Permission, {
      through: models.RolePermission,
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
    });
  }
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    role_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: {
        name: 'unique_role_name',
        msg: 'Role name already exists',
      },
      validate: {
        notEmpty: {
          msg: 'Role name cannot be empty',
        },
        isIn: {
          args: [['super_admin', 'tenant_owner', 'admin', 'manager', 'project_manager', 'volunteer', 'donor']],
          msg: 'Invalid role name',
        },
      },
      comment: 'Unique role name',
    },

    scope: {
      type: DataTypes.ENUM('global', 'tenant', 'public'),
      allowNull: false,
      defaultValue: 'tenant',
      comment: 'Scope of the role: global (platform-wide), tenant (NGO-specific), public (limited access)',
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the role and its responsibilities',
    },

    hierarchy_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Hierarchy level for role comparison (higher = more privileges). super_admin=7, donor=1',
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the role is active and can be assigned',
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    // Indexes for performance
    indexes: [
      {
        unique: true,
        fields: ['role_name'],
        name: 'idx_roles_role_name',
      },
      {
        fields: ['scope'],
        name: 'idx_roles_scope',
      },
      {
        fields: ['is_active'],
        name: 'idx_roles_is_active',
      },
      {
        fields: ['hierarchy_level'],
        name: 'idx_roles_hierarchy_level',
      },
    ],
  }
);

export default Role;
