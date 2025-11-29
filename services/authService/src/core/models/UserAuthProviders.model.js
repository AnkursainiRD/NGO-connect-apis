import { DataTypes, Model } from "sequelize";
import sequelize from "#config/database.js";

class UserAuthProviders extends Model {
    /**
     * Define associations
     * @param {Object} models - All models
     */
    static associate(models) {
        // UserAuthProviders belongs to User
        this.belongsTo(models.User, {
            foreignKey: 'user_id',
            as: 'user',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
}

UserAuthProviders.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        provider_name: {
            type: DataTypes.ENUM('google', 'facebook', 'github', 'twitter', 'linkedin', 'firebase'),
            allowNull: false,
        },
        provider_user_id: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: true, // Email might not always be available from provider
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true, // Name might not always be available
        },
        provider_profile_picture: {
            type: DataTypes.TEXT,
            allowNull: true, // Profile picture is optional
        }
    },
    {
        sequelize,
        modelName: "UserAuthProviders",
        tableName: "user_auth_providers",
        timestamps: true,
        createdAt: "created_at", // Use snake_case for database columns
        updatedAt: "updated_at", // Use snake_case for database columns
    }
);

export default UserAuthProviders;
