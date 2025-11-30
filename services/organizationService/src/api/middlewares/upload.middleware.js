/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Upload Middleware
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Multer configuration for handling file uploads.
 * Handles temporary storage and file validation.
 * 
 * @module api/middlewares/upload
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure upload directory exists
 */
const uploadDir = path.join(__dirname, '../../../uploads/temp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Multer disk storage configuration
 * Stores files temporarily before uploading to Cloudinary
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

/**
 * File filter for image uploads
 */
const imageFileFilter = (req, file, cb) => {
  // Allowed image extensions
  const allowedExtensions = /jpeg|jpg|png|gif|webp/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExtensions.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
  }
};

/**
 * File filter for documents
 */
const documentFileFilter = (req, file, cb) => {
  // Allowed document extensions
  const allowedExtensions = /pdf|doc|docx|xls|xlsx/;
  const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  
  if (extname) {
    cb(null, true);
  } else {
    cb(new Error('Only document files (pdf, doc, docx, xls, xlsx) are allowed!'), false);
  }
};

/**
 * Multer configuration for image uploads
 */
export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: imageFileFilter,
});

/**
 * Multer configuration for document uploads
 */
export const uploadDocument = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: documentFileFilter,
});

/**
 * Multer configuration for avatar uploads
 */
export const uploadAvatar = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for avatars
  },
  fileFilter: imageFileFilter,
});

/**
 * Cleanup uploaded file after processing
 * Use this in controllers after uploading to Cloudinary
 */
export const cleanupUploadedFile = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to cleanup uploaded file:', error);
  }
};

/**
 * Default export
 */
export default {
  uploadImage,
  uploadDocument,
  uploadAvatar,
  cleanupUploadedFile,
};
