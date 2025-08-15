const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kullanıcıyı veritabanından bul
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userVehicles: {
          include: {
            variant: {
              include: {
                model: {
                  include: {
                    brand: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          userVehicles: {
            include: {
              variant: {
                include: {
                  model: {
                    include: {
                      brand: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Optional auth olduğu için hata durumunda devam et
    next();
  }
};

module.exports = { auth, optionalAuth };
