const express = require('express');
const AuthController = require('../controllers/AuthController');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Public routes (authentication gerekmez)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes (authentication gerekir)
router.get('/profile', auth, AuthController.getProfile);
router.put('/profile', auth, AuthController.updateProfile);
router.post('/logout', auth, AuthController.logout);
router.post('/change-password', auth, AuthController.changePassword);

module.exports = router;
