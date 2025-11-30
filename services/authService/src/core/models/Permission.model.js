import { DataTypes, Model } from 'sequelize';
import sequelize from '#config/database.js';

/**
 * Permission Model
 * Represents granular permissions in the RBAC system
 */
class Permission extends Model {
  /**
   * Get permission display name
   * @returns {string}
   */
  getDisplayName() {
    return `${this.resource}.${this.action}`;
  }

  /**
   * Define associations
   * @param {Object} models - All models
   */
  static associate(models) {
    // Permission belongs to many roles through RolePermission
    this.belongsToMany(models.Role, {
      through: models.RolePermission,
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles',
    });
  }
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    permission_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_permission_name',
        msg: 'Permission name already exists',
      },
      validate: {
        notEmpty: {
          msg: 'Permission name cannot be empty',
        },
      },
      comment: 'Unique permission identifier (e.g., users.create, projects.update)',
    },

    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Resource cannot be empty',
        },
      },
      comment: 'Resource type (e.g., users, projects, volunteers, donations)',
    },

    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Action cannot be empty',
        },
        isIn: {
          args: [['create', 'read', 'update', 'delete', 'list', 'manage', 'approve', 'assign']],
          msg: 'Invalid action type',
        },
      },
      comment: 'Action type (e.g., create, read, update, delete, list, manage)',
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this permission grants',
    },

    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether the permission is active',
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
    modelName: 'Permission',
    tableName: 'permissions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',

    // Indexes for performance
    indexes: [
      {
        unique: true,
        fields: ['permission_name'],
        name: 'idx_permissions_permission_name',
      },
      {
        fields: ['resource'],
        name: 'idx_permissions_resource',
      },
      {
        fields: ['action'],
        name: 'idx_permissions_action',
      },
      {
        unique: true,
        fields: ['resource', 'action'],
        name: 'idx_permissions_resource_action',
      },
      {
        fields: ['is_active'],
        name: 'idx_permissions_is_active',
      },
    ],
  }
);

export default Permission;
