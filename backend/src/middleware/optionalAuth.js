const jwt = require('jsonwebtoken');

// Optional authentication middleware
// Adds user info to request if token is provided, but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // If no auth header, continue without user info
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.token = null;
      return next();
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if session exists
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

    // If session exists and is valid, add user info
    if (session && session.expiresAt > new Date() && session.user.isActive) {
      req.user = decoded;
      req.token = token;
      req.userSession = session;
    } else {
      req.user = null;
      req.token = null;
    }

    next();

  } catch (error) {
    // On any error, just continue without user info
    req.user = null;
    req.token = null;
    next();
  }
};

module.exports = optionalAuth;
