const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const logger = require('../utils/logger');

class AuthController {
  // User Registration
  static async register(req, res) {
    try {
      // Validation schema
      const schema = Joi.object({
        email: Joi.string().email().required(),
        name: Joi.string().min(2).max(50).required(),
        phone: Joi.string().min(10).max(15),
        password: Joi.string().min(6).required(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { email, name, phone, password } = value;

      // Check if user already exists
      const existingUser = await req.prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists',
          message: 'A user with this email already exists.',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await req.prisma.user.create({
        data: {
          email,
          name,
          phone,
          password: hashedPassword,
          preferences: {
            create: {
              isDarkMode: true,
              notificationsEnabled: true,
              fastChargingOnly: false,
              maxDistance: 100,
              language: 'tr'
            }
          }
        },
        include: {
          preferences: true
        }
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Create session
      await req.prisma.userSession.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Remove password from response
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        message: 'User registered successfully',
        user: userWithoutPassword,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during registration.',
        code: 'REGISTRATION_ERROR'
      });
    }
  }

  // User Login
  static async login(req, res) {
    try {
      // Validation schema
      const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { email, password } = value;

      // Find user
      const user = await req.prisma.user.findUnique({
        where: { email },
        include: {
          preferences: true
        }
      });

      if (!user) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(403).json({
          error: 'Account deactivated',
          message: 'Your account has been deactivated. Please contact support.',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect.',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Create or update session
      await req.prisma.userSession.upsert({
        where: { token: token },
        update: {
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        create: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      // Remove password from response
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;

      logger.info(`User logged in: ${email}`);

      res.json({
        message: 'Login successful',
        user: userWithoutPassword,
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during login.',
        code: 'LOGIN_ERROR'
      });
    }
  }

  // User Logout
  static async logout(req, res) {
    try {
      const token = req.token;

      // Delete session
      await req.prisma.userSession.delete({
        where: { token }
      });

      logger.info(`User logged out: ${req.user.email}`);

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'An error occurred during logout.',
        code: 'LOGOUT_ERROR'
      });
    }
  }

  // Get Current User
  static async getCurrentUser(req, res) {
    try {
      const user = await req.prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          preferences: true,
          _count: {
            select: {
              favorites: true,
              chargingSessions: true,
              routes: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      // Remove password from response
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;

      res.json({
        user: userWithoutPassword
      });

    } catch (error) {
      logger.error('Get current user error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_USER_ERROR'
      });
    }
  }

  // Refresh Token
  static async refreshToken(req, res) {
    try {
      const { userId } = req.user;

      // Generate new JWT token
      const user = await req.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Invalid user',
          code: 'INVALID_USER'
        });
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update session
      await req.prisma.userSession.update({
        where: { token: req.token },
        data: {
          token: newToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      res.json({
        message: 'Token refreshed successfully',
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'TOKEN_REFRESH_ERROR'
      });
    }
  }
}

module.exports = AuthController;
