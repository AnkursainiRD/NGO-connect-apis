import { Router } from 'express';
import UploadController from '#api/controllers/uploadController.js';

const router = Router();
const uploadController = new UploadController();

/**
 * Upload routes
 * Endpoints for generating signed upload URLs
 */

// POST /api/v1/upload/avatar-url - Get signed URL for avatar upload
router.post('/avatar-url', uploadController.getAvatarUploadUrl);

// POST /api/v1/upload/document-url - Get signed URL for document upload
router.post('/document-url', uploadController.getDocumentUploadUrl);

// POST /api/v1/upload/ngo-image-url - Get signed URL for NGO image upload
router.post('/ngo-image-url', uploadController.getNGOImageUploadUrl);

// POST /api/v1/upload/update-avatar - Update user avatar URL after upload
router.post('/update-avatar', uploadController.updateAvatarUrl);

export { router as uploadRoutes };
