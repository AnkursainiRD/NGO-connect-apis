import { DataTypes, Model } from "sequelize";
import sequelize from '#config/database.js'


// CREATE TABLE organizations (
//     id BIGINT PRIMARY KEY AUTO_INCREMENT,
//     name VARCHAR(150) NOT NULL,
//     slug VARCHAR(100) NOT NULL UNIQUE,                 -- short identifier for URLs/APIs
//     domain VARCHAR(150) NULL,                          -- optional custom domain
//     email VARCHAR(150) NOT NULL UNIQUE,
//     phone VARCHAR(20) NULL,                            -- allows country codes, spaces, dashes
//     logo_url VARCHAR(255) NULL,
//     address TEXT NULL,
//     plan_type ENUM('free', 'pro', 'enterprise') DEFAULT 'free',
//     status ENUM('active', 'suspended', 'inactive') DEFAULT 'active',
//     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//     deleted_at TIMESTAMP NULL                          -- for soft delete
// );

/**
 * Organization Model
 * Represents NGO/Organizations in the platform
 */
class Organization extends Model {
  /**
   * Check if organization is active
   * @returns {boolean}
   */
  isActive() {
    return this.status === 'active';
  }

  /**
   * Check if organization is suspended
   * @returns {boolean}
   */
  isSuspended() {
    return this.status === 'suspended';
  }

  /**
   * Check if organization has a custom domain
   * @returns {boolean}
   */
  hasCustomDomain() {
    return !!this.domain;
  }

  /**
   * Check plan type
   * @param {string} planType
   * @returns {boolean}
   */
  hasPlan(planType) {
    return this.plan_type === planType;
  }

  /**
   * Transform organization object for API response
   * @returns {object}
   */
  toJSON() {
    const values = { ...this.get() };
    delete values.deleted_at;
    return values;
  }

  /**
   * Define associations
   * @param {Object} models - All models
   */
  static associate(models) {
    // Organization has many members/users
    // this.hasMany(models.OrganizationMember, {
    //   foreignKey: 'organization_id',
    //   as: 'members',
    //   onDelete: 'CASCADE'
    // });

    // Organization has many projects
    // this.hasMany(models.Project, {
    //   foreignKey: 'organization_id',
    //   as: 'projects',
    //   onDelete: 'CASCADE'
    // });
  }
}

Organization.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Organization name cannot be empty',
        },
        len: {
          args: [2, 150],
          msg: 'Organization name must be between 2 and 150 characters',
        },
      },
      comment: 'Organization/NGO name',
    },

    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'unique_slug',
        msg: 'Slug already exists',
      },
      validate: {
        notEmpty: {
          msg: 'Slug cannot be empty',
        },
        is: {
          args: /^[a-z0-9-]+$/,
          msg: 'Slug must contain only lowercase letters, numbers, and hyphens',
        },
        len: {
          args: [2, 100],
          msg: 'Slug must be between 2 and 100 characters',
        },
      },
      comment: 'URL-friendly identifier',
    },

    domain: {
      type: DataTypes.STRING(150),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Must be a valid domain',
        },
      },
      comment: 'Custom domain for the organization',
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
      comment: 'Organization contact email',
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
      comment: 'Organization contact phone',
    },

    logo_url: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'URL to organization logo',
    },

    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Organization physical address',
    },

    plan_type: {
      type: DataTypes.ENUM('free', 'pro', 'enterprise'),
      allowNull: false,
      defaultValue: 'free',
      validate: {
        isIn: {
          args: [['free', 'pro', 'enterprise']],
          msg: 'Invalid plan type',
        },
      },
      comment: 'Subscription plan type',
    },

    status: {
      type: DataTypes.ENUM('active', 'suspended', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: {
          args: [['active', 'suspended', 'inactive']],
          msg: 'Invalid status',
        },
      },
      comment: 'Organization status',
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
    modelName: 'Organization',
    tableName: 'organizations',
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
        name: 'idx_organizations_email',
      },
      {
        unique: true,
        fields: ['slug'],
        name: 'idx_organizations_slug',
      },
      {
        fields: ['status'],
        name: 'idx_organizations_status',
      },
      {
        fields: ['plan_type'],
        name: 'idx_organizations_plan_type',
      },
      {
        fields: ['domain'],
        name: 'idx_organizations_domain',
      },
      {
        fields: ['created_at'],
        name: 'idx_organizations_created_at',
      },
    ],
  }
);
export default Organization;