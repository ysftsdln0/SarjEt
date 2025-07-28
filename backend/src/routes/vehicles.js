const express = require('express');
const VehicleController = require('../controllers/VehicleController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', VehicleController.getAllVehicles);
router.get('/search', VehicleController.searchVehicles);
router.get('/makes', VehicleController.getMakes);
router.get('/models/:make', VehicleController.getModelsByMake);
router.get('/statistics', VehicleController.getStatistics);
router.get('/:id', VehicleController.getVehicle);

// Protected routes (admin only)
router.post('/reload', authMiddleware, VehicleController.reloadData);

module.exports = router;
