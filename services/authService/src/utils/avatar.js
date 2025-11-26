/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Avatar Utility
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Generates placeholder avatar images from user initials
 * Uses UI Avatars API for automatic avatar generation
 * 
 * @module utils/avatar
 */

/**
 * Generate avatar URL from user name using UI Avatars API
 * 
 * @param {string} name - User's full name
 * @param {Object} options - Customization options
 * @param {number} options.size - Image size in pixels (default: 200)
 * @param {string} options.background - Background color hex (without #) or 'random'
 * @param {string} options.color - Text color hex (without #) (default: 'fff')
 * @param {boolean} options.rounded - Rounded avatar (default: true)
 * @param {boolean} options.bold - Bold text (default: true)
 * @param {number} options.length - Number of initials (default: 2)
 * @returns {string} - Avatar URL
 */
export const generateAvatarUrl = (name, options = {}) => {
  if (!name || typeof name !== 'string') {
    throw new Error('Name is required to generate avatar');
  }

  const {
    size = 200,
    background = 'random',
    color = 'fff',
    rounded = true,
    bold = true,
    length = 2,
  } = options;

  const params = new URLSearchParams({
    name: name.trim(),
    size: size.toString(),
    background,
    color,
    rounded: rounded.toString(),
    bold: bold.toString(),
    uppercase: 'true',
    length: length.toString(),
    'font-size': '0.5',
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
};

/**
 * Get initials from name
 * 
 * @param {string} name - User's full name
 * @param {number} maxLength - Maximum number of initials (default: 2)
 * @returns {string} - Initials (e.g., "AS" for "Ankur Saini")
 */
export const getInitials = (name, maxLength = 2) => {
  if (!name || typeof name !== 'string') {
    return '';
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
 * Generate avatar with custom color scheme based on user role
 * 
 * @param {string} name - User's name
 * @param {string} role - User role (donor, volunteer, ngo_admin, super_admin)
 * @returns {string} - Avatar URL
 */
export const generateRoleBasedAvatar = (name, role = 'donor') => {
  const roleColors = {
    donor: { background: '4CAF50', color: 'fff' },        // Green
    volunteer: { background: '2196F3', color: 'fff' },    // Blue
    ngo_admin: { background: 'FF9800', color: 'fff' },    // Orange
    super_admin: { background: '9C27B0', color: 'fff' },  // Purple
  };

  const colors = roleColors[role] || roleColors.donor;

  return generateAvatarUrl(name, {
    background: colors.background,
    color: colors.color,
    size: 200,
    rounded: true,
    bold: true,
  });
};

/**
 * Generate themed avatars with predefined color schemes
 * 
 * @param {string} name - User's name
 * @param {string} theme - Theme name (default, primary, success, danger, warning, info)
 * @returns {string} - Avatar URL
 */
export const generateThemedAvatar = (name, theme = 'default') => {
  const themes = {
    default: { background: 'random', color: 'fff' },
    primary: { background: '0D8ABC', color: 'fff' },
    success: { background: '28a745', color: 'fff' },
    danger: { background: 'dc3545', color: 'fff' },
    warning: { background: 'ffc107', color: '000' },
    info: { background: '17a2b8', color: 'fff' },
  };

  const colors = themes[theme] || themes.default;

  return generateAvatarUrl(name, {
    background: colors.background,
    color: colors.color,
    rounded: true,
  });
};

export default {
  generateAvatarUrl,
  getInitials,
  generateRoleBasedAvatar,
  generateThemedAvatar,
};
