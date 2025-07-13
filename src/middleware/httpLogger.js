
import { logHttp } from '../config/logger.js';

/**
 * HTTP request logging middleware
 * Logs all incoming HTTP requests with response time
 */
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capture the original end function
  const originalEnd = res.end;
  
  // Override the end function to log when response is sent
  res.end = function(chunk, encoding) {
    // Call the original end function
    originalEnd.call(res, chunk, encoding);
    
    // Calculate response time
    const responseTime = Date.now() - start;
    
    // Log the HTTP request
    logHttp(req, res, responseTime);
  };
  
  next();
};

export default httpLogger;
