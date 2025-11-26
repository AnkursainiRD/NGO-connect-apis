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
}

User.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    tenant_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: 'Organization/NGO tenant ID for multi-tenancy',
    },

    name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        len: {
          args: [2, 100],
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
          args: [['local', 'google', 'facebook', 'github', 'microsoft']],
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
        fields: ['tenant_id'],
        name: 'idx_users_tenant_id',
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
