const chargingStationService = require('../services/chargingStationService');
const logger = require('../utils/logger');
const Joi = require('joi');

class ChargingStationController {
  
  // Yakındaki şarj istasyonlarını getir
  async getNearbyStations(req, res) {
    try {
      const schema = Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
        radius: Joi.number().min(1).max(500).default(50), // km - Türkiye geneli için artırıldı
        limit: Joi.number().min(1).max(100).default(20)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { latitude, longitude, radius, limit } = value;

      const stations = chargingStationService.findNearbyStations(
        latitude, longitude, radius, limit
      );

      res.json({
        success: true,
        data: {
          stations,
          searchParams: {
            latitude,
            longitude,
            radius,
            limit
          },
          count: stations.length
        }
      });

    } catch (error) {
      logger.error('Error getting nearby stations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Şehre göre istasyonları getir
  async getStationsByCity(req, res) {
    try {
      const schema = Joi.object({
        city: Joi.string().min(2).required(),
        limit: Joi.number().min(1).max(100).default(50)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { city, limit } = value;

      const stations = chargingStationService.findStationsByCity(city, limit);

      res.json({
        success: true,
        data: {
          stations,
          searchParams: { city, limit },
          count: stations.length
        }
      });

    } catch (error) {
      logger.error('Error getting stations by city:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // İstasyon detayını getir
  async getStationDetail(req, res) {
    try {
      const { stationId } = req.params;
      
      if (!stationId || isNaN(stationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid station ID'
        });
      }

      const station = chargingStationService.getStationById(parseInt(stationId));

      if (!station) {
        return res.status(404).json({
          success: false,
          message: 'Charging station not found'
        });
      }

      res.json({
        success: true,
        data: { station }
      });

    } catch (error) {
      logger.error('Error getting station detail:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Tüm istasyonları getir (sayfalama ile)
  async getAllStations(req, res) {
    try {
      const schema = Joi.object({
        page: Joi.number().min(1).default(1),
        limit: Joi.number().min(1).max(100).default(20)
      });

      const { error, value } = schema.validate(req.query);
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: error.details.map(detail => detail.message)
        });
      }

      const { page, limit } = value;
      const result = chargingStationService.getAllStations(page, limit);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error getting all stations:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // İstatistikleri getir
  async getStats(req, res) {
    try {
      const stats = chargingStationService.getStats();

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Error getting station stats:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Cache'i manuel yenile (admin only)
  async refreshCache(req, res) {
    try {
      // Bu endpoint sadece admin kullanıcılar için olabilir
      // Şu an basit kontrol yapıyoruz
      if (req.user && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      await chargingStationService.refreshCache();

      res.json({
        success: true,
        message: 'Cache refreshed successfully',
        data: { 
          refreshedAt: new Date().toISOString(),
          stats: chargingStationService.getStats()
        }
      });

    } catch (error) {
      logger.error('Error refreshing cache:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh cache'
      });
    }
  }

  // Cache durumunu kontrol et
  async getCacheStatus(req, res) {
    try {
      const stats = chargingStationService.getStats();
      
      res.json({
        success: true,
        data: {
          cacheStatus: {
            isLoaded: chargingStationService.isLoaded,
            stationCount: stats.totalStations,
            lastUpdate: stats.lastUpdate
          },
          stats
        }
      });

    } catch (error) {
      logger.error('Error getting cache status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // İstasyon değerlendirmelerini getir
  async getStationReviews(req, res) {
    try {
      const { stationId } = req.params;
      
      if (!stationId || isNaN(stationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid station ID'
        });
      }

      // TODO: Implement actual review fetching from database
      // For now, return mock reviews
      const mockReviews = [
        {
          id: '1',
          userId: 'user1',
          userName: 'Ahmet Y.',
          rating: 5,
          comment: 'Çok hızlı şarj, park yeri de var. Kesinlikle tavsiye ederim!',
          date: '2024-01-15',
          photos: [],
          helpful: 12,
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Fatma K.',
          rating: 4,
          comment: 'İyi istasyon ama biraz pahalı. Hızlı şarj yapıyor.',
          date: '2024-01-14',
          photos: [],
          helpful: 8,
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Mehmet A.',
          rating: 5,
          comment: 'Mükemmel! 24 saat açık ve güvenli.',
          date: '2024-01-13',
          photos: [],
          helpful: 15,
        },
      ];

      res.json({
        success: true,
        data: { reviews: mockReviews }
      });

    } catch (error) {
      logger.error('Error getting station reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // İstasyon değerlendirmesi ekle
  async addStationReview(req, res) {
    try {
      const { stationId } = req.params;
      const { rating, comment } = req.body;
      
      if (!stationId || isNaN(stationId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid station ID'
        });
      }

      // Validate input
      const schema = Joi.object({
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().min(10).max(500).required()
      });

      const { error } = schema.validate({ rating, comment });
      if (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parameters',
          errors: error.details.map(detail => detail.message)
        });
      }

      // TODO: Implement actual review saving to database
      // For now, just return success
      const newReview = {
        id: Date.now().toString(),
        userId: req.user?.id || 'anonymous',
        userName: req.user?.name || 'Anonim Kullanıcı',
        rating,
        comment,
        date: new Date().toISOString().split('T')[0],
        photos: [],
        helpful: 0,
      };

      res.status(201).json({
        success: true,
        message: 'Review added successfully',
        data: { review: newReview }
      });

    } catch (error) {
      logger.error('Error adding station review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new ChargingStationController();
