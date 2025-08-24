/**
 * Simple middleware to log incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const logRequest = (req, res, next) => {
  const start = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Log request body if it exists and isn't too large
  if (req.body && Object.keys(req.body).length > 0 && req.method !== 'GET') {
    // Don't log passwords or sensitive data
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.otp) sanitizedBody.otp = '[REDACTED]';
    
    // Only log if body isn't too big
    const bodyString = JSON.stringify(sanitizedBody);
    if (bodyString.length < 1000) {
      console.log(`Request Body: ${bodyString}`);
    } else {
      console.log(`Request Body: [Large payload - ${bodyString.length} bytes]`);
    }
  }
  
  // Add response logging
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Status: ${res.statusCode} - Duration: ${duration}ms`);
    return originalSend.apply(this, arguments);
  };
  
  next();
}; 