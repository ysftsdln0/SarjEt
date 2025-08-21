const express = require('express');
const router = express.Router();
const chargingStationController = require('../controllers/ChargingStationController');
const { optionalAuth } = require('../middleware/auth');

// Cache kontrolü ve istatistikler
router.get('/cache/status', chargingStationController.getCacheStatus);
router.get('/stats', chargingStationController.getStats);

// Cache yenileme (admin only)
router.post('/cache/refresh', optionalAuth, chargingStationController.refreshCache);

// Yakındaki istasyonları getir
// GET /api/stations/nearby?latitude=41.0082&longitude=28.9784&radius=50&limit=20
router.get('/nearby', chargingStationController.getNearbyStations);

// Şehre göre istasyonları getir  
// GET /api/stations/city?city=Istanbul&limit=50
router.get('/city', chargingStationController.getStationsByCity);

// Tüm istasyonları getir (sayfalama ile)
// GET /api/stations?page=1&limit=20
router.get('/', chargingStationController.getAllStations);

// İstasyon detayını getir
// GET /api/stations/12345
router.get('/:stationId', chargingStationController.getStationDetail);

// İstasyon değerlendirmelerini getir
// GET /api/stations/12345/reviews
router.get('/:stationId/reviews', chargingStationController.getStationReviews);

// İstasyon değerlendirmesi ekle
// POST /api/stations/12345/reviews
router.post('/:stationId/reviews', optionalAuth, chargingStationController.addStationReview);

module.exports = router;
