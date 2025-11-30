import { DataTypes, Model } from 'sequelize';
import sequelize from '#config/database.js';

/**
 * RolePermission Model
 * Junction table linking roles to permissions (many-to-many)
 */
class RolePermission extends Model {
  /**
   * Define associations
   * @param {Object} models - All models
   */
  static associate(models) {
    // RolePermission belongs to Role
    this.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
      onDelete: 'CASCADE',
    });

    // RolePermission belongs to Permission
    this.belongsTo(models.Permission, {
      foreignKey: 'permission_id',
      as: 'permission',
      onDelete: 'CASCADE',
    });
  }
}

RolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'roles',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Foreign key to roles table',
    },

    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'permissions',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'Foreign key to permissions table',
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
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    // Indexes for performance
    indexes: [
      {
        unique: true,
        fields: ['role_id', 'permission_id'],
        name: 'idx_role_permissions_unique',
      },
      {
        fields: ['role_id'],
        name: 'idx_role_permissions_role_id',
      },
      {
        fields: ['permission_id'],
        name: 'idx_role_permissions_permission_id',
      },
    ],
  }
);

export default RolePermission;
