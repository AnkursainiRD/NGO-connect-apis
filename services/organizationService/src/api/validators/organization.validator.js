/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Organization Validators
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Validation rules for organization CRUD operations.
 * Uses express-validator for request validation.
 * 
 * @module api/validators/organization
 */

import { body, param, query, validationResult } from 'express-validator';

/**
 * Validation error handler
 * Formats validation errors into a consistent response structure
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array().map(err => ({
          field: err.path || err.param,
          message: err.msg,
          value: err.value,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  }
  next();
};

/**
 * Create Organization Validation Rules
 * Validates all required fields for creating a new organization
 */
export const createOrganizationValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Organization name is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Organization name must be between 2 and 150 characters'),

  body('slug')
    .trim()
    .notEmpty()
    .withMessage('Slug is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
    .custom((value) => {
      // Ensure slug doesn't start or end with hyphen
      if (value.startsWith('-') || value.endsWith('-')) {
        throw new Error('Slug cannot start or end with a hyphen');
      }
      // Ensure no consecutive hyphens
      if (value.includes('--')) {
        throw new Error('Slug cannot contain consecutive hyphens');
      }
      return true;
    }),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .isLength({ max: 150 })
    .withMessage('Email must not exceed 150 characters')
    .normalizeEmail(),

  body('domain')
    .optional()
    .trim()
    .isURL({ require_protocol: false, require_tld: true })
    .withMessage('Must be a valid domain')
    .isLength({ max: 150 })
    .withMessage('Domain must not exceed 150 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),

  body('logo_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
    .isLength({ max: 255 })
    .withMessage('Logo URL must not exceed 255 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),

  body('plan_type')
    .optional()
    .isIn(['free', 'pro', 'enterprise'])
    .withMessage('Plan type must be one of: free, pro, enterprise')
    .default('free'),

  body('status')
    .optional()
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Status must be one of: active, suspended, inactive')
    .default('active'),

  handleValidationErrors,
];

/**
 * Update Organization Validation Rules
 * All fields are optional for updates
 */
export const updateOrganizationValidator = [
  param('id')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer')
    .toInt(),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Organization name must be between 2 and 150 characters'),

  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens')
    .custom((value) => {
      if (value.startsWith('-') || value.endsWith('-')) {
        throw new Error('Slug cannot start or end with a hyphen');
      }
      if (value.includes('--')) {
        throw new Error('Slug cannot contain consecutive hyphens');
      }
      return true;
    }),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .isLength({ max: 150 })
    .withMessage('Email must not exceed 150 characters')
    .normalizeEmail(),

  body('domain')
    .optional()
    .trim()
    .isURL({ require_protocol: false, require_tld: true })
    .withMessage('Must be a valid domain')
    .isLength({ max: 150 })
    .withMessage('Domain must not exceed 150 characters'),

  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must not exceed 20 characters')
    .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
    .withMessage('Invalid phone number format'),

  body('logo_url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Logo URL must be a valid URL')
    .isLength({ max: 255 })
    .withMessage('Logo URL must not exceed 255 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Address must not exceed 1000 characters'),

  body('plan_type')
    .optional()
    .isIn(['free', 'pro', 'enterprise'])
    .withMessage('Plan type must be one of: free, pro, enterprise'),

  body('status')
    .optional()
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Status must be one of: active, suspended, inactive'),

  handleValidationErrors,
];

/**
 * Get Organization by ID Validation Rules
 */
export const getOrganizationValidator = [
  param('id')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer')
    .toInt(),

  handleValidationErrors,
];

/**
 * Get Organization by Slug Validation Rules
 */
export const getOrganizationBySlugValidator = [
  param('slug')
    .trim()
    .notEmpty()
    .withMessage('Organization slug is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Slug must be between 2 and 100 characters')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Invalid slug format'),

  handleValidationErrors,
];

/**
 * Delete Organization Validation Rules
 */
export const deleteOrganizationValidator = [
  param('id')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer')
    .toInt(),

  handleValidationErrors,
];

/**
 * List Organizations Validation Rules
 * Supports pagination, filtering, and sorting
 */
export const listOrganizationsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt()
    .default(1),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
    .default(10),

  query('status')
    .optional()
    .isIn(['active', 'suspended', 'inactive', 'all'])
    .withMessage('Status must be one of: active, suspended, inactive, all'),

  query('plan_type')
    .optional()
    .isIn(['free', 'pro', 'enterprise', 'all'])
    .withMessage('Plan type must be one of: free, pro, enterprise, all'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),

  query('sort_by')
    .optional()
    .isIn(['name', 'email', 'created_at', 'updated_at', 'plan_type', 'status'])
    .withMessage('Sort by must be one of: name, email, created_at, updated_at, plan_type, status')
    .default('created_at'),

  query('sort_order')
    .optional()
    .isIn(['asc', 'desc', 'ASC', 'DESC'])
    .withMessage('Sort order must be either asc or desc')
    .toLowerCase()
    .default('desc'),

  handleValidationErrors,
];

/**
 * Update Organization Status Validation Rules
 */
export const updateOrganizationStatusValidator = [
  param('id')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer')
    .toInt(),

  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'suspended', 'inactive'])
    .withMessage('Status must be one of: active, suspended, inactive'),

  handleValidationErrors,
];

/**
 * Update Organization Plan Validation Rules
 */
export const updateOrganizationPlanValidator = [
  param('id')
    .notEmpty()
    .withMessage('Organization ID is required')
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer')
    .toInt(),

  body('plan_type')
    .notEmpty()
    .withMessage('Plan type is required')
    .isIn(['free', 'pro', 'enterprise'])
    .withMessage('Plan type must be one of: free, pro, enterprise'),

  handleValidationErrors,
];

/**
 * Export all validators
 */
export default {
  handleValidationErrors,
  createOrganizationValidator,
  updateOrganizationValidator,
  getOrganizationValidator,
  getOrganizationBySlugValidator,
  deleteOrganizationValidator,
  listOrganizationsValidator,
  updateOrganizationStatusValidator,
  updateOrganizationPlanValidator,
};