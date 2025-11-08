const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          message: 'Access denied. No token provided.',
          code: 'NO_TOKEN'
        }
      });
    }

    // Get token from "Bearer <token>"
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach userId to request object
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    // Handle different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: {
          message: 'Token has expired.',
          code: 'TOKEN_EXPIRED'
        }
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: {
          message: 'Invalid token.',
          code: 'INVALID_TOKEN'
        }
      });
    }
    
    // Handle malformed tokens or other errors
    return res.status(401).json({
      error: {
        message: 'Token verification failed.',
        code: 'TOKEN_VERIFICATION_FAILED'
      }
    });
  }
};

module.exports = authMiddleware;
