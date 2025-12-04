/**
 * Request Logger Middleware
 * Logs all incoming requests with timing information
 */

export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Attach request ID to request object
  req.requestId = requestId;
  
  // Log request
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📥 [${requestId}] ${req.method} ${req.path}`);
  console.log(`   Time: ${new Date().toISOString()}`);
  if (req.body && Object.keys(req.body).length > 0) {
    const bodyPreview = JSON.stringify(req.body).substring(0, 200);
    console.log(`   Body: ${bodyPreview}${bodyPreview.length >= 200 ? '...' : ''}`);
  }
  
  // Log response when finished
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`📤 [${requestId}] ${res.statusCode} (${duration}ms)`);
    console.log(`${'='.repeat(60)}\n`);
    return originalSend.call(this, data);
  };
  
  next();
}

