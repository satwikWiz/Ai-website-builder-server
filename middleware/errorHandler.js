/**
 * Global Error Handler Middleware
 * Catches all errors and returns consistent error responses
 */

export function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'unknown';
  
  console.error(`\n❌ [${requestId}] Error:`, err.message);
  console.error(`   Stack:`, err.stack);
  console.error(`${'='.repeat(60)}\n`);
  
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Build error response
  const errorResponse = {
    success: false,
    error: err.message || 'Internal server error',
    requestId,
    timestamp: new Date().toISOString(),
  };
  
  // Add debug info in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      stack: err.stack,
      name: err.name,
    };
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found Handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
    method: req.method,
  });
}

