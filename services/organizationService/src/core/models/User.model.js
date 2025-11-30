import { DataTypes, Model } from 'sequelize';
import sequelize from '#config/database.js';
import bcrypt from 'bcrypt';
import { appConfig } from '#config/app.config.js';

/**
 * User Model
 * Represents authenticated users in the NGOConnect platform
 */
class User extends Model {
  /**
   * Compare password with hashed password
   * @param {string} password - Plain text password
   * @returns {Promise<boolean>}
   */
  async comparePassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  /**
   * Transform user object for API response (remove sensitive fields)
   * @returns {object}
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.reset_token;
    delete values.reset_token_expires_at;
    delete values.deleted_at;
    return values;
  }

  /**
   * Check if email is verified
   * @returns {boolean}
   */
  isEmailVerified() {
    return this.email_verified;
  }

  /**
   * Check if phone is verified
   * @returns {boolean}
   */
  isPhoneVerified() {
    return this.phone_verified;
  }

  /**
   * Check if two-factor authentication is enabled
   * @returns {boolean}
   */
  isTwoFactorEnabled() {
    return this.two_factor_enabled;
  }

  /**
   * Check if user has a specific role
   * @param {string} roleName - Role name to check
   * @returns {boolean}
   */
  async hasRole(roleName) {
    if (!this.role) {
      await this.reload({ include: ['role'] });
    }
    return this.role?.role_name === roleName;
  }

  /**
   * Check if user has a role with hierarchy level >= specified role
   * @param {string} roleName - Role name to check against
   * @param {Object} models - Models object to access Role model
   * @returns {Promise<boolean>}
   */
  async hasRoleOrHigher(roleName, models) {
    if (!this.role) {
      await this.reload({ include: ['role'] });
    }
    
    const targetRole = await models.Role.findOne({ where: { role_name: roleName } });
    if (!targetRole) return false;
    
    return this.role?.hierarchy_level >= targetRole.hierarchy_level;
  }

  /**
   * Check if user has a specific permission
   * @param {string} permissionName - Permission name (e.g., 'users.create')
   * @returns {Promise<boolean>}
   */
  async hasPermission(permissionName) {
    if (!this.role) {
      await this.reload({ include: [{ association: 'role', include: ['permissions'] }] });
    }
    
    return this.role?.permissions?.some(p => p.permission_name === permissionName) || false;
  }

  /**
   * Get all user permissions
   * @returns {Promise<Array>}
   */
  async getPermissions() {
    if (!this.role) {
      await this.reload({ include: [{ association: 'role', include: ['permissions'] }] });
    }
    
    return this.role?.permissions || [];
  }

  /**
   * Define associations
   * @param {Object} models - All models
   */
  static associate(models) {
    // User belongs to a Role
    this.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
      onDelete: 'SET NULL'
    });

    // User has many activity logs
    this.hasMany(models.UserActivityLogs, {
      foreignKey: 'user_id',
      as: 'activityLogs',
      onDelete: 'SET NULL'
    });
    
    // User has many auth providers (OAuth connections)
    this.hasMany(models.UserAuthProviders, {
      foreignKey: 'user_id',
      as: 'authProviders',
      onDelete: 'CASCADE'
    });
    
    // Add other associations here as you create models
    // this.hasMany(models.RefreshToken, {
    //   foreignKey: 'user_id',
    //   as: 'refreshTokens',
    //   onDelete: 'CASCADE'
    // });
  }
}

User.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    org_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Organization ID for multi-tenancy',
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [1, 100],
          msg: 'Name must be between 2 and 100 characters',
        },
      },
      comment: 'Full name of the user',
    },

    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: {
        name: 'unique_email',
        msg: 'Email address already exists',
      },
      validate: {
        isEmail: {
          msg: 'Must be a valid email address',
        },
      },
      comment: 'User email address',
    },

    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true, // Nullable for OAuth users
      comment: 'Bcrypt hashed password',
    },

    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: {
          args: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
          msg: 'Invalid phone number format',
        },
      },
      comment: 'User phone number',
    },

    refresh_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Refresh token for authentication',
    },
    
    avatar_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL to user avatar/profile picture',
    },

    phone_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether phone is verified',
    },

    email_verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether email is verified',
    },

    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable initially for migration purposes
      references: {
        model: 'roles',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
      comment: 'Foreign key to roles table',
    },

    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last login timestamp',
    },

    auth_provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'local',
      validate: {
        isIn: {
          args: [['local', 'google', 'facebook', 'github', 'microsoft', 'firebase']],
          msg: 'Invalid auth provider',
        },
      },
      comment: 'Authentication provider (local, google, facebook, etc.)',
    },

    two_factor_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether two-factor authentication is enabled',
    },

    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Password reset token',
    },

    reset_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Password reset token expiration',
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
      comment: 'Soft delete timestamp',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    timestamps: true,
    paranoid: true, // Enable soft deletes
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',

    // Indexes for performance
    indexes: [
      {
        unique: true,
        fields: ['email'],
        name: 'idx_users_email',
      },
      {
        fields: ['org_id'],
        name: 'idx_users_org_id',
      },
      {
        fields: ['auth_provider'],
        name: 'idx_users_auth_provider',
      },
      {
        fields: ['created_at'],
        name: 'idx_users_created_at',
      },
      {
        fields: ['reset_token'],
        name: 'idx_users_reset_token',
      },
    ],

    // Hooks for password hashing
    hooks: {
      beforeCreate: async (user) => {
        // Only hash if password is provided (not for OAuth users)
        if (user.password_hash && user.auth_provider === 'local') {
          const salt = await bcrypt.genSalt(appConfig.security.bcryptSaltRounds);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
      beforeUpdate: async (user) => {
        // Only hash if password_hash was changed
        if (user.changed('password_hash') && user.password_hash && user.auth_provider === 'local') {
          const salt = await bcrypt.genSalt(appConfig.security.bcryptSaltRounds);
          user.password_hash = await bcrypt.hash(user.password_hash, salt);
        }
      },
    },
  }
);

export default User;
