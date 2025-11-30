import { Organization } from "#models/index.js";
import { conflictResponse, errorResponse, successResponse } from "#utils/response.js";
import { Op } from "sequelize";
import { uploadOrganizationLogo } from '#utils/upload.js';
import { cleanupUploadedFile } from '#api/middlewares/upload.middleware.js';


export default class OrganizationController {
    
    createOrganization = async (req, res) => {
        try {
            const { name, slug, email, domain, phone, logo_url, address, plan_type, status } = req.body;
            
            // Check if organization already exists
            const existedOrg = await Organization.findOne({ 
                where: { 
                    [Op.or]: [{ slug }, { email }]
                }
            });
            
            if (existedOrg) {
                const field = existedOrg.slug === slug ? 'slug' : 'email';
                return conflictResponse(res, `Organization with this ${field} already exists`);
            }

            // Prepare organization data with defaults
            const orgSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
            const orgDomain = domain || null;
            const orgPhone = phone || null;
            let orgLogoUrl = logo_url || null;
            const orgAddress = address || null;
            const orgPlanType = plan_type || 'free';
            const orgStatus = status || 'active';

            // Upload Logo to Cloudinary if file is provided
            if (req.file) {
                try {
                    // Simple helper function - just pass file path and org ID!
                    const result = await uploadOrganizationLogo(req.file.path, orgSlug);
                    orgLogoUrl = result.secure_url;
                    
                    // Cleanup temp file after upload
                    cleanupUploadedFile(req.file.path);
                } catch (uploadError) {
                    console.error('Logo upload error:', uploadError);
                    // Cleanup temp file even on error
                    if (req.file && req.file.path) {
                        cleanupUploadedFile(req.file.path);
                    }
                    // Continue without logo if upload fails
                }
            }

            // Create organization
            const org = await Organization.create({ 
                name, 
                slug: orgSlug, 
                email, 
                domain: orgDomain, 
                phone: orgPhone, 
                logo_url: orgLogoUrl, 
                address: orgAddress, 
                plan_type: orgPlanType, 
                status: orgStatus 
            });
            
            return successResponse(res, org, 'Organization created successfully', 201);
            
        } catch (error) {
            // Handle specific Sequelize errors
            if (error.name === 'SequelizeUniqueConstraintError') {
                return conflictResponse(res, 'Organization with this email or slug already exists');
            }
            if (error.name === 'SequelizeValidationError') {
                return errorResponse(res, error.errors[0].message, 400);
            }
            console.error('Create organization error:', error);
            return errorResponse(res, 'Failed to create organization', 500);
        }
    }

    getOrganization = async (req, res) => {
        try {
            
        } catch (error) {
            
        }
    }

    updateOrganization = async (req, res) => {
        try {
            
        } catch (error) {
            
        }
    }

    deleteOrganization = async (req, res) => {
        try {
            
        } catch (error) {
            
        }
    }

    listOrganizations = async (req, res) => {
        try {
            
        } catch (error) {
            
        }
    }

}