const express = require('express');
const router = express.Router();
const RouteController = require('../controllers/RouteController');

// Info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'Route planning API',
    endpoints: [
      'POST /api/routes/plan - Plan new route with charging stops'
    ]
  });
});

// Plan a route with charging stops
router.post('/plan', RouteController.plan);

module.exports = router;
