import { DataTypes, Model } from "sequelize";
import sequelize from "#config/database.js";
import { appConfig } from "#config/app.config.js";

export class UserActivityLogs extends Model {
    /**
     * Define associations
     * @param {Object} models - All models
     */
    static associate(models) {
        // UserActivityLogs belongs to User
        this.belongsTo(models.User,{foreignKey: 'user_id',as: 'user'});
        
        // User activity log belongs to an organization
        // this.belongsTo(models.Organization,{foreignKey: 'org_id',as: 'organization'});
    }

    /**
     * Helper method to log user activity
     * @param {Object} activityData - The activity data to log
     * @returns {Promise<UserActivityLogs>}
     */
    static async logActivity(activityData) {
        try {
            return await this.create(activityData);
        } catch (error) {
            console.error('Error logging user activity:', error);
            throw error;
        }
    }
}
// CREATE TABLE activity_logs (
//   id BIGINT PRIMARY KEY AUTO_INCREMENT,
//   org_id BIGINT NULL,                          -- FK → organizations.id
//   user_id BIGINT NULL,                            -- FK → users.id
//   entity_type VARCHAR(100) NULL,                  -- e.g., 'project', 'donation', 'campaign'
//   entity_id BIGINT NULL,
//   action VARCHAR(100) NULL,                       -- e.g., 'created', 'updated', 'deleted'
//   description TEXT NULL,
//   ip_address VARCHAR(50) NULL,
//   user_agent VARCHAR(255) NULL,
//   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
 
UserActivityLogs.init({
    id:{
        type:DataTypes.BIGINT,
        primaryKey:true,
        autoIncrement:true,
        allowNull:false
    },
    org_id:{
        type:DataTypes.BIGINT,
        allowNull:true,
        comment:'Organization ID for multi-tenancy',
    },
    user_id:{
        type:DataTypes.BIGINT,
        allowNull:true,
        comment:'User ID for user activity',
    },
    entity_type:{
        type:DataTypes.STRING(100),
        allowNull:true,
        comment:'Entity type (e.g., project, donation, campaign)',
    },
    entity_id:{
        type:DataTypes.BIGINT,
        allowNull:true,
        comment:'Entity ID',
    },
    action:{
        type:DataTypes.STRING(100),
        allowNull:true,
        comment:'Action performed (e.g., created, updated, deleted)',
    },
    description:{
        type:DataTypes.TEXT,
        allowNull:true,
        comment:'Description of the action',
    },
    ip_address:{
        type:DataTypes.STRING(50),
        allowNull:true,
        comment:'IP address of the user',
    },
    user_agent:{
        type:DataTypes.STRING(255),
        allowNull:true,
        comment:'User agent of the user',
    },
    created_at:{
        type:DataTypes.DATE,
        allowNull:false,
        defaultValue:DataTypes.NOW,
    },
    updated_at:{
        type:DataTypes.DATE,
        allowNull:false,
        defaultValue:DataTypes.NOW,
    },
    deleted_at:{
        type:DataTypes.DATE,
        allowNull:true,
        comment:'Soft delete timestamp',
    },
}, {
    sequelize,
    tableName: 'activity_logs',
    timestamps: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
})

export default UserActivityLogs;