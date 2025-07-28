const express = require('express');
const ChargingStationController = require('../controllers/ChargingStationController');
const authMiddleware = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// Public routes
router.get('/', optionalAuth, ChargingStationController.getStations);
router.get('/operators', ChargingStationController.getOperators);
router.get('/connector-types', ChargingStationController.getConnectorTypes);
router.get('/:id', optionalAuth, ChargingStationController.getStation);

// Protected routes (admin only)
router.post('/sync', authMiddleware, ChargingStationController.syncStations);

module.exports = router;
