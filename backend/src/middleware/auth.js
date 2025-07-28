const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided or invalid format.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists in database
    const session = await req.prisma.userSession.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    if (!session) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token not found in active sessions.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await req.prisma.userSession.delete({
        where: { token }
      });

      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Check if user is active
    if (!session.user.isActive) {
      return res.status(403).json({
        error: 'Account deactivated',
        message: 'Your account has been deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Add user info to request
    req.user = decoded;
    req.token = token;
    req.userSession = session;

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Token is malformed or invalid.',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    logger.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = authMiddleware;
