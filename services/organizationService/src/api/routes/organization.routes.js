/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Organization Routes
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * All organization-related endpoints with:
 * - File upload support for logos
 * - Validation middleware
 * - CRUD operations
 * 
 * @module api/routes/organization
 */

import { Router } from 'express';
import OrganizationController from '#api/controllers/organizationController.js';
import { uploadImage } from '#api/middlewares/upload.middleware.js';
import { requireRoleOrHigher, requireOrgAccess } from '#api/middlewares/rbac.middleware.js';
import { createOrganizationValidator, updateOrganizationValidator, getOrganizationValidator, getOrganizationBySlugValidator, deleteOrganizationValidator, listOrganizationsValidator, updateOrganizationStatusValidator,updateOrganizationPlanValidator,} from '#api/validators/organization.validator.js';

const router = Router();
const controller = new OrganizationController();

/**
 * @route   POST /api/organizations
 * @desc    Create a new organization
 * @access  Private (requires authentication)
 * @body    { name, email, slug?, domain?, phone?, address?, plan_type?, status? }
 * @file    logo (optional) - Organization logo image
 */
router.post('/createOrganization', uploadImage.single('logo'), requireRoleOrHigher('org_owner'), createOrganizationValidator, controller.createOrganization);

/**
 * @route   GET /api/organizations
 * @desc    List all organizations with pagination and filters
 * @access  Private
 * @query   { page?, limit?, status?, plan_type?, search?, sort_by?, sort_order? }
 */
router.get('/listOrganizations', listOrganizationsValidator, controller.listOrganizations);

/**
 * @route   GET /api/organizations/:id
 * @desc    Get organization by ID
 * @access  Private
 * @param   {number} id - Organization ID
 */
router.get('/getOrganization/:id', getOrganizationValidator, controller.getOrganization);

/**
 * @route   GET /api/organizations/slug/:slug
 * @desc    Get organization by slug
 * @access  Public
 * @param   {string} slug - Organization slug
 */
router.get('/getOrganizationBySlug/:slug', getOrganizationBySlugValidator, controller.getOrganization);

/**
 * @route   PUT /api/organizations/:id
 * @desc    Update organization details
 * @access  Private
 * @param   {number} id - Organization ID
 * @body    { name?, email?, slug?, domain?, phone?, address?, plan_type?, status? }
 * @file    logo (optional) - New organization logo
 */
router.put('/updateOrganization/:id', uploadImage.single('logo'), updateOrganizationValidator, controller.updateOrganization);

/**
 * @route   PATCH /api/organizations/:id/status
 * @desc    Update organization status only
 * @access  Private (Admin only)
 * @param   {number} id - Organization ID
 * @body    { status: 'active' | 'suspended' | 'inactive' }
 */
router.patch('/updateOrganizationStatus/:id/status', updateOrganizationStatusValidator, controller.updateOrganization);

/**
 * @route   PATCH /api/organizations/:id/plan
 * @desc    Update organization plan type
 * @access  Private (Admin only)
 * @param   {number} id - Organization ID
 * @body    { plan_type: 'free' | 'pro' | 'enterprise' }
 */
router.patch('/updateOrganizationPlan/:id/plan', updateOrganizationPlanValidator, controller.updateOrganization);

/**
 * @route   DELETE /api/organizations/:id
 * @desc    Delete organization (soft delete)
 * @access  Private (Super Admin only)
 * @param   {number} id - Organization ID
 */
router.delete('/deleteOrganization/:id', deleteOrganizationValidator, controller.deleteOrganization);

export { router as organizationRoutes };
export default router;
