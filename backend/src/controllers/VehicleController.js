const Joi = require('joi');
const logger = require('../utils/logger');
const evDataService = require('../services/EVDataService');

class VehicleController {
  // Tüm araçları getir
  static async getAllVehicles(req, res) {
    try {
      const schema = Joi.object({
        make: Joi.string(),
        minYear: Joi.number().min(2010).max(2030),
        maxYear: Joi.number().min(2010).max(2030),
        minBattery: Joi.number().min(0),
        minRange: Joi.number().min(0),
        minChargingPower: Joi.number().min(0),
        maxConsumption: Joi.number().min(0),
        connectorType: Joi.string(),
        search: Joi.string(),
        limit: Joi.number().min(1).max(1000).default(100),
        page: Joi.number().min(1).default(1)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { search, limit, page, ...filters } = value;

      let vehicles;

      // Arama varsa arama yap
      if (search) {
        vehicles = evDataService.searchVehicles(search);
      } else {
        // Filtreleme uygula
        vehicles = evDataService.filterVehicles(filters);
      }

      // Sayfalama uygula
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedVehicles = vehicles.slice(startIndex, endIndex);

      res.json({
        vehicles: paginatedVehicles,
        total: vehicles.length,
        page,
        limit,
        hasMore: endIndex < vehicles.length,
        filters: filters
      });

    } catch (error) {
      logger.error('Get vehicles error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_VEHICLES_ERROR'
      });
    }
  }

  // Tekil araç getir
  static async getVehicle(req, res) {
    try {
      const { id } = req.params;

      const vehicle = evDataService.getVehicleById(id);

      if (!vehicle) {
        return res.status(404).json({
          error: 'Vehicle not found',
          code: 'VEHICLE_NOT_FOUND'
        });
      }

      res.json({ vehicle });

    } catch (error) {
      logger.error('Get vehicle error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_VEHICLE_ERROR'
      });
    }
  }

  // Marka listesi
  static async getMakes(req, res) {
    try {
      const makes = evDataService.getMakes();

      res.json({
        makes: makes.map(make => ({
          name: make,
          vehicleCount: evDataService.filterVehicles({ make }).length
        }))
      });

    } catch (error) {
      logger.error('Get makes error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_MAKES_ERROR'
      });
    }
  }

  // Belirli marka için modeller
  static async getModelsByMake(req, res) {
    try {
      const { make } = req.params;

      if (!make) {
        return res.status(400).json({
          error: 'Make parameter is required',
          code: 'MISSING_MAKE'
        });
      }

      const models = evDataService.getModelsByMake(make);

      res.json({
        make,
        models,
        total: models.length
      });

    } catch (error) {
      logger.error('Get models error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_MODELS_ERROR'
      });
    }
  }

  // Araç arama
  static async searchVehicles(req, res) {
    try {
      const schema = Joi.object({
        q: Joi.string().min(2).required(),
        limit: Joi.number().min(1).max(100).default(20)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message,
          code: 'VALIDATION_ERROR'
        });
      }

      const { q, limit } = value;

      const vehicles = evDataService.searchVehicles(q);
      const limitedResults = vehicles.slice(0, limit);

      res.json({
        query: q,
        vehicles: limitedResults,
        total: vehicles.length,
        shown: limitedResults.length
      });

    } catch (error) {
      logger.error('Search vehicles error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'SEARCH_VEHICLES_ERROR'
      });
    }
  }

  // İstatistikler
  static async getStatistics(req, res) {
    try {
      const stats = evDataService.getStatistics();

      res.json({
        statistics: stats,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Get vehicle statistics error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_STATISTICS_ERROR'
      });
    }
  }

  // EV data'yı yeniden yükle (admin endpoint)
  static async reloadData(req, res) {
    try {
      evDataService.reloadData();

      res.json({
        message: 'EV data reloaded successfully',
        reloadedAt: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Reload EV data error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'RELOAD_DATA_ERROR'
      });
    }
  }
}

module.exports = VehicleController;
