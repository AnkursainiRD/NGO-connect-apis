/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Local Avatar Generator
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Generates avatar images locally on the server using Canvas
 * No external API dependencies - fully self-hosted
 * 
 * @module utils/localAvatar
 */

import { createCanvas } from 'canvas';
import fs from 'fs';

/**
 * Get initials from name
 */
const getInitials = (name, maxLength = 2) => {
  if (!name || typeof name !== 'string') {
    return '??';
  }

  return name
    .trim()
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
};

/**
 * Generate random color
 */
const generateRandomColor = () => {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#FFA07A', // Orange
    '#98D8C8', // Mint
    '#F7DC6F', // Yellow
    '#BB8FCE', // Purple
    '#85C1E2', // Light Blue
    '#F8B500', // Gold
    '#52B788', // Green
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Get contrast text color (white or black) based on background
 */
const getContrastColor = (hexColor) => {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Generate avatar image locally using Canvas
 * 
 * @param {string} name - User's name
 * @param {Object} options - Generation options
 * @param {number} options.size - Image size (default: 200)
 * @param {string} options.backgroundColor - Background color hex (default: random)
 * @param {string} options.textColor - Text color hex (default: auto contrast)
 * @param {boolean} options.rounded - Circular avatar (default: true)
 * @returns {Buffer} - Image buffer (PNG)
 */
export const generateAvatarImage = (name, options = {}) => {
  const {
    size = 200,
    backgroundColor = generateRandomColor(),
    textColor = getContrastColor(backgroundColor),
    rounded = true,
  } = options;

  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Draw background
  if (rounded) {
    // Circular background
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    ctx.clip(); // Clip to circle for text
  } else {
    // Square background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, size, size);
  }

  // Get initials
  const initials = getInitials(name);

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${size * 0.4}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2);

  // Return PNG buffer
  return canvas.toBuffer('image/png');
};

/**
 * Generate avatar and upload to Cloudinary
 * 
 * @param {string} userId - User ID
 * @param {string} name - User's name
 * @param {Object} options - Generation options
 * @returns {Promise<string>} - Cloudinary URL
 */
export const generateAndUploadAvatar = async (userId, name, options = {}) => {
  try {
    // Dynamic import for cloudinary
    const { default: cloudinary } = await import('#config/cloudinary.config.js');
    const { logger } = await import('#utils/logger.js');
    
    // Generate avatar image
    const imageBuffer = generateAvatarImage(name, options);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'ngo-connect/avatars',
          public_id: `avatar_${userId}_${Date.now()}`,
          resource_type: 'image',
          format: 'png',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      // Write buffer to upload stream
      uploadStream.end(imageBuffer);
    });

    logger.info('Avatar uploaded to Cloudinary', { 
      userId, 
      url: uploadResult.secure_url 
    });

    return uploadResult.secure_url;

  } catch (error) {
    console.error('Failed to generate and upload avatar:', error);
    throw new Error('Failed to generate avatar');
  }
};

/**
 * Generate role-based avatar colors
 */
const getRoleColor = (role) => {
  const roleColors = {
    donor: '#4CAF50',        // Green
    volunteer: '#2196F3',    // Blue
    ngo_admin: '#FF9800',    // Orange
    super_admin: '#9C27B0',  // Purple
  };
  return roleColors[role] || generateRandomColor();
};

/**
 * Generate avatar for user with role-based coloring
 * 
 * @param {string} userId - User ID
 * @param {string} name - User's name
 * @param {string} role - User role
 * @returns {Promise<string>} - Cloudinary URL
 */
export const generateRoleAvatar = async (userId, name, role = 'donor') => {
  const backgroundColor = getRoleColor(role);
  return generateAndUploadAvatar(userId, name, { backgroundColor });
};

/**
 * Save avatar image to local file (for testing)
 * 
 * @param {string} name - User's name
 * @param {string} filepath - File path to save
 */
export const saveAvatarToFile = (name, filepath) => {
  const imageBuffer = generateAvatarImage(name);
  fs.writeFileSync(filepath, imageBuffer);
  console.log('Avatar saved locally:', filepath);
};

export default {
  generateAvatarImage,
  generateAndUploadAvatar,
  generateRoleAvatar,
  saveAvatarToFile,
};
