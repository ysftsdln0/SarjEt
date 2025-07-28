const axios = require('axios');
const Joi = require('joi');
const logger = require('../utils/logger');
const { calculateDistance } = require('../utils/geoUtils');
const cache = require('../utils/cache');

class ChargingStationController {
  // Get all charging stations with filters
  static async getStations(req, res) {
    try {
      const schema = Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
        radius: Joi.number().min(1).max(500).default(100), // km
        minPowerKW: Joi.number().min(0).default(0),
        maxPowerKW: Joi.number().min(0).default(1000),
        connectionTypes: Joi.array().items(Joi.string()),
        operators: Joi.array().items(Joi.string()),
        onlyFastCharging: Joi.boolean().default(false),
        onlyAvailable: Joi.boolean().default(false),
        onlyFree: Joi.boolean().default(false),
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

      const {
        latitude,
        longitude,
        radius,
        minPowerKW,
        maxPowerKW,
        connectionTypes,
        operators,
        onlyFastCharging,
        onlyAvailable,
        onlyFree,
        limit,
        page
      } = value;

      // Build cache key
      const cacheKey = `stations:${JSON.stringify(value)}`;
      
      // Check cache first
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        return res.json(cachedResult);
      }

      // Build where clause for database query
      let whereClause = {
        isOperational: onlyAvailable ? true : undefined,
        isFree: onlyFree ? true : undefined,
        maxPowerKW: {
          gte: onlyFastCharging ? 50 : minPowerKW,
          lte: maxPowerKW
        }
      };

      // Filter by connection types
      if (connectionTypes && connectionTypes.length > 0) {
        whereClause.connectorTypes = {
          hasSome: connectionTypes
        };
      }

      // Filter by operators
      if (operators && operators.length > 0) {
        whereClause.operatorName = {
          in: operators
        };
      }

      // Get stations from database
      const stations = await req.prisma.chargingStation.findMany({
        where: whereClause,
        include: {
          connections: true,
          _count: {
            select: {
              favorites: true,
              chargingSessions: true
            }
          }
        },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          lastUpdated: 'desc'
        }
      });

      // If user location provided, calculate distances and sort by distance
      let processedStations = stations;
      if (latitude && longitude) {
        processedStations = stations
          .map(station => ({
            ...station,
            distance: calculateDistance(
              latitude,
              longitude,
              station.latitude,
              station.longitude
            )
          }))
          .filter(station => station.distance <= radius)
          .sort((a, b) => a.distance - b.distance);
      }

      const result = {
        stations: processedStations,
        total: processedStations.length,
        page,
        limit,
        hasMore: processedStations.length === limit
      };

      // Cache result for 5 minutes
      await cache.set(cacheKey, result, 300);

      res.json(result);

    } catch (error) {
      logger.error('Get stations error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_STATIONS_ERROR'
      });
    }
  }

  // Get single station by ID
  static async getStation(req, res) {
    try {
      const { id } = req.params;

      const station = await req.prisma.chargingStation.findUnique({
        where: { id },
        include: {
          connections: true,
          favorites: req.user ? {
            where: { userId: req.user.userId }
          } : false,
          chargingSessions: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: { name: true }
              }
            }
          },
          _count: {
            select: {
              favorites: true,
              chargingSessions: true
            }
          }
        }
      });

      if (!station) {
        return res.status(404).json({
          error: 'Station not found',
          code: 'STATION_NOT_FOUND'
        });
      }

      res.json({ station });

    } catch (error) {
      logger.error('Get station error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_STATION_ERROR'
      });
    }
  }

  // Sync stations from OpenChargeMap API
  static async syncStations(req, res) {
    try {
      const { countrycode = 'TR', maxresults = 10000 } = req.query;

      logger.info('Starting station sync from OpenChargeMap...');

      // Fetch from OpenChargeMap API
      const response = await axios.get('https://api.openchargemap.io/v3/poi', {
        params: {
          key: process.env.OPENCHARGE_MAP_API_KEY,
          countrycode,
          maxresults,
          output: 'json',
          compact: true,
          verbose: false
        },
        timeout: 30000
      });

      const externalStations = response.data;
      logger.info(`Fetched ${externalStations.length} stations from OpenChargeMap`);

      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      // Process stations in batches
      const batchSize = 100;
      for (let i = 0; i < externalStations.length; i += batchSize) {
        const batch = externalStations.slice(i, i + batchSize);
        
        await Promise.allSettled(
          batch.map(async (externalStation) => {
            try {
              const stationData = this.transformOpenChargeMapData(externalStation);
              
              const existingStation = await req.prisma.chargingStation.findUnique({
                where: { externalId: stationData.externalId }
              });

              if (existingStation) {
                // Update existing station
                await req.prisma.chargingStation.update({
                  where: { id: existingStation.id },
                  data: {
                    ...stationData,
                    lastUpdated: new Date()
                  }
                });
                updatedCount++;
              } else {
                // Create new station
                await req.prisma.chargingStation.create({
                  data: stationData
                });
                createdCount++;
              }
            } catch (err) {
              logger.error(`Error processing station ${externalStation.ID}:`, err);
              errorCount++;
            }
          })
        );

        // Log progress
        if ((i + batchSize) % 1000 === 0) {
          logger.info(`Processed ${i + batchSize} stations...`);
        }
      }

      // Clear cache after sync
      await cache.flushPattern('stations:*');

      logger.info(`Station sync completed: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors`);

      res.json({
        message: 'Station sync completed',
        stats: {
          total: externalStations.length,
          created: createdCount,
          updated: updatedCount,
          errors: errorCount
        }
      });

    } catch (error) {
      logger.error('Station sync error:', error);
      res.status(500).json({
        error: 'Station sync failed',
        code: 'SYNC_ERROR'
      });
    }
  }

  // Transform OpenChargeMap data to our schema
  static transformOpenChargeMapData(externalStation) {
    const addressInfo = externalStation.AddressInfo || {};
    const operatorInfo = externalStation.OperatorInfo || {};
    const connections = externalStation.Connections || [];

    // Calculate max power
    const maxPowerKW = connections.length > 0 
      ? Math.max(...connections.map(c => c.PowerKW || 0).filter(p => p > 0))
      : 0;

    // Extract connector types
    const connectorTypes = connections
      .map(c => c.ConnectionType?.Title)
      .filter(Boolean)
      .filter((type, index, self) => self.indexOf(type) === index);

    return {
      externalId: externalStation.ID.toString(),
      title: addressInfo.Title || 'Unknown Station',
      address: addressInfo.AddressLine1 || null,
      city: addressInfo.Town || null,
      latitude: addressInfo.Latitude,
      longitude: addressInfo.Longitude,
      operatorName: operatorInfo.Title || null,
      operatorWebsite: operatorInfo.WebsiteURL || null,
      operatorPhone: operatorInfo.PhonePrimaryContact || null,
      numberOfPoints: externalStation.NumberOfPoints || connections.length,
      isOperational: externalStation.StatusType?.IsOperational !== false,
      maxPowerKW: maxPowerKW,
      connectorTypes: connectorTypes,
      dataQualityLevel: externalStation.DataQualityLevel || 1,
      lastConfirmed: externalStation.DateLastConfirmed 
        ? new Date(externalStation.DateLastConfirmed) 
        : null,
      lastUpdated: new Date()
    };
  }

  // Get available operators
  static async getOperators(req, res) {
    try {
      const cacheKey = 'operators:list';
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const operators = await req.prisma.chargingStation.groupBy({
        by: ['operatorName'],
        where: {
          operatorName: { not: null },
          isOperational: true
        },
        _count: {
          operatorName: true
        },
        orderBy: {
          _count: {
            operatorName: 'desc'
          }
        }
      });

      const result = operators.map(op => ({
        name: op.operatorName,
        stationCount: op._count.operatorName
      }));

      await cache.set(cacheKey, result, 3600); // Cache for 1 hour

      res.json({ operators: result });

    } catch (error) {
      logger.error('Get operators error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_OPERATORS_ERROR'
      });
    }
  }

  // Get available connector types
  static async getConnectorTypes(req, res) {
    try {
      const cacheKey = 'connectors:types';
      const cached = await cache.get(cacheKey);
      
      if (cached) {
        return res.json(cached);
      }

      const stations = await req.prisma.chargingStation.findMany({
        where: { isOperational: true },
        select: { connectorTypes: true }
      });

      const allTypes = stations.flatMap(s => s.connectorTypes);
      const typeCounts = allTypes.reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const result = Object.entries(typeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      await cache.set(cacheKey, result, 3600); // Cache for 1 hour

      res.json({ connectorTypes: result });

    } catch (error) {
      logger.error('Get connector types error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'GET_CONNECTOR_TYPES_ERROR'
      });
    }
  }
}

module.exports = ChargingStationController;
