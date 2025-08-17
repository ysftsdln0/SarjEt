const { planRoute } = require('../services/routePlanner');

function validateCoord(p) {
  return p && typeof p.latitude === 'number' && typeof p.longitude === 'number';
}

module.exports = {
  plan: async (req, res, next) => {
    try {
      const { start, end, vehicle, currentSocPercent, reservePercent, corridorKm, maxStops, chargeAfterStopPercent } = req.body || {};
      if (!validateCoord(start) || !validateCoord(end)) {
        return res.status(400).json({ success: false, error: 'Geçersiz koordinatlar' });
      }
      const result = planRoute({ start, end, vehicle, currentSocPercent, reservePercent, corridorKm, maxStops, chargeAfterStopPercent });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
};
