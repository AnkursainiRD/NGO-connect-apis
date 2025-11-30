/**
 * 404 Not Found handler middleware
 * Handles requests to undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'ROUTE_NOT_FOUND',
      path: req.originalUrl || req.url,
      method: req.method,
    },
    timestamp: new Date().toISOString(),
  });
};
