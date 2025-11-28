/**
 * ═══════════════════════════════════════════════════════════════════════════
 * API Response Utility
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Standardized response format for all API endpoints
 * Ensures consistency across the entire Auth Service
 * 
 * @module utils/response
 */

/**
 * Success Response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {*} options.data - Response data
 * @param {string} options.message - Success message
 * @param {number} options.statusCode - HTTP status code (default: 200)
 * @param {Object} options.meta - Optional metadata (pagination, etc.)
 */
export const successResponse = (res, { data = null, message = 'Success', statusCode = 200, meta = null }) => {
  const response = {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };

  // Add metadata if provided (for pagination, etc.)
  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

/**
 * Error Response
 * @param {Object} res - Express response object
 * @param {Object} options - Error options
 * @param {string} options.message - Error message
 * @param {string} options.code - Error code
 * @param {number} options.statusCode - HTTP status code (default: 400)
 * @param {Array|Object} options.details - Additional error details
 */
export const errorResponse = (res, { message, code = 'ERROR', statusCode = 400, details = null }) => {
  console.log("error message", message);
  const response = {
    success: false,
    error: {
      message,
      code,
    },
    timestamp: new Date().toISOString(),
  };

  // Add details if provided (for validation errors, etc.)
  if (details) {
    response.error.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation Error Response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
export const validationErrorResponse = (res, errors) => {
  return errorResponse(res, {
    message: 'Validation failed',
    code: 'VALIDATION_ERROR',
    statusCode: 400,
    details: errors,
  });
};

/**
 * Created Response (201)
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 */
export const createdResponse = (res, { data = null, message = 'Resource created successfully' }) => {
  return successResponse(res, {
    data,
    message,
    statusCode: 201,
  });
};

/**
 * No Content Response (204)
 * @param {Object} res - Express response object
 */
export const noContentResponse = (res) => {
  return res.status(204).send();
};

/**
 * Unauthorized Response (401)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const unauthorizedResponse = (res, message = 'Unauthorized access') => {
  return errorResponse(res, {
    message,
    code: 'UNAUTHORIZED',
    statusCode: 401,
  });
};

/**
 * Forbidden Response (403)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const forbiddenResponse = (res, message = 'Access forbidden') => {
  return errorResponse(res, {
    message,
    code: 'FORBIDDEN',
    statusCode: 403,
  });
};

/**
 * Not Found Response (404)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return errorResponse(res, {
    message,
    code: 'NOT_FOUND',
    statusCode: 404,
  });
};

/**
 * Bad Request Response (400)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const badRequestResponse = (res, message = 'Bad request') => {
  return errorResponse(res, {
    message,
    code: 'BAD_REQUEST',
    statusCode: 400,
  });
};


/**
 * Conflict Response (409)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const conflictResponse = (res, message = 'Resource already exists') => {
  return errorResponse(res, {
    message,
    code: 'CONFLICT',
    statusCode: 409,
  });
};

/**
 * Internal Server Error Response (500)
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 */
export const internalErrorResponse = (res, message = 'Internal server error') => {
  return errorResponse(res, {
    message,
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  });
};

/**
 * Paginated Response
 * @param {Object} res - Express response object
 * @param {Object} options - Response options
 * @param {Array} options.data - Array of items
 * @param {number} options.page - Current page
 * @param {number} options.limit - Items per page
 * @param {number} options.total - Total items
 * @param {string} options.message - Success message
 */
export const paginatedResponse = (res, { data = [], page = 1, limit = 10, total = 0, message = 'Success' }) => {
  const totalPages = Math.ceil(total / limit);
  
  return successResponse(res, {
    data,
    message,
    meta: {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
  });
};

/**
 * Default export for convenience
 */
export default {
  success: successResponse,
  error: errorResponse,
  validationError: validationErrorResponse,
  created: createdResponse,
  noContent: noContentResponse,
  unauthorized: unauthorizedResponse,
  forbidden: forbiddenResponse,
  notFound: notFoundResponse,
  conflict: conflictResponse,
  internalError: internalErrorResponse,
  paginated: paginatedResponse,
  badRequest: badRequestResponse,
};
