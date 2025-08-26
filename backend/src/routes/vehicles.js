const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Tüm markaları getir
router.get('/brands', async (req, res) => {
  try {
    const brands = await prisma.vehicleBrand.findMany({
      orderBy: { name: 'asc' }
    });
    
    res.json(brands);
  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({ error: 'Markalar alınamadı' });
  }
});

// Belirli markanın modellerini getir
router.get('/brands/:brandId/models', async (req, res) => {
  try {
    const { brandId } = req.params;
    
    const models = await prisma.vehicleModel.findMany({
      where: { brandId },
      orderBy: { name: 'asc' }
    });
    
    res.json(models);
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ error: 'Modeller alınamadı' });
  }
});

// Belirli modelin varyantlarını getir
router.get('/models/:modelId/variants', async (req, res) => {
  try {
    const { modelId } = req.params;
    const { year } = req.query;
    
    const whereClause = { modelId };
    if (year) {
      whereClause.year = parseInt(year);
    }
    
    const variants = await prisma.vehicleVariant.findMany({
      where: whereClause,
      orderBy: [
        { year: 'desc' },
        { name: 'asc' }
      ]
    });
    
    res.json(variants);
  } catch (error) {
    console.error('Get variants error:', error);
    res.status(500).json({ error: 'Varyantlar alınamadı' });
  }
});

// Belirli varyantın detaylarını getir
router.get('/variants/:variantId', async (req, res) => {
  try {
    const { variantId } = req.params;
    
    const variant = await prisma.vehicleVariant.findUnique({
      where: { id: variantId },
      include: {
        model: {
          include: {
            brand: true
          }
        }
      }
    });
    
    if (!variant) {
      return res.status(404).json({ error: 'Varyant bulunamadı' });
    }
    
    res.json(variant);
  } catch (error) {
    console.error('Get variant error:', error);
    res.status(500).json({ error: 'Varyant detayları alınamadı' });
  }
});

// Test endpoint - API'nin çalışıp çalışmadığını kontrol et
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Vehicles API is working!', 
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /api/vehicles/test',
      'GET /api/vehicles/brands',
      'GET /api/vehicles/user-vehicle/primary',
      'GET /api/vehicles/user-vehicles'
    ]
  });
});

// Kullanıcının varsayılan/ana aracını getir (rota planlama için) - ÖNCE GELMELİ
// Geçici olarak auth middleware'i kaldırıldı - test için
router.get('/user-vehicle/primary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Primary vehicle endpoint called for user:', userId);
    
    // Önce kullanıcının tüm araçlarını kontrol et
    const allUserVehicles = await prisma.userVehicle.findMany({
      where: { userId }
    });
    console.log('All user vehicles:', allUserVehicles.length, 'found');
    console.log('Vehicle details:', allUserVehicles.map(v => ({ id: v.id, isActive: v.isActive, variantId: v.variantId })));
    
    // İlk araç varsayılan araç olarak kabul edilir
    let primaryVehicle = await prisma.userVehicle.findFirst({
      where: { userId, isActive: true },
      include: {
        variant: {
          include: {
            model: {
              include: {
                brand: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Eğer aktif araç bulunamadıysa, herhangi bir aracı al
    if (!primaryVehicle) {
      console.log('No active vehicle found, trying any vehicle...');
      primaryVehicle = await prisma.userVehicle.findFirst({
        where: { userId },
        include: {
          variant: {
            include: {
              model: {
                include: {
                  brand: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
    }

    console.log('Primary vehicle found:', !!primaryVehicle);

    if (!primaryVehicle) {
      console.log('No primary vehicle found for user:', userId);
      return res.status(404).json({ 
        message: 'Henüz bir araç eklememişsiniz. Lütfen profil ayarlarından bir araç ekleyin.',
        code: 'NO_VEHICLE_FOUND'
      });
    }

    // Rota planlama için gerekli teknik özellikleri dahil et
    const vehicleWithSpecs = {
      id: primaryVehicle.id,
      nickname: primaryVehicle.nickname,
      licensePlate: primaryVehicle.licensePlate,
      color: primaryVehicle.color,
      currentBatteryLevel: primaryVehicle.currentBatteryLevel,
      brand: primaryVehicle.variant.model.brand.name,
      model: primaryVehicle.variant.model.name,
      variant: primaryVehicle.variant.name,
      year: primaryVehicle.variant.year,
      // Teknik özellikler - Prisma schema'dan alınıyor
      batteryCapacity: primaryVehicle.variant.batteryCapacity,
      range: primaryVehicle.variant.maxRange, // maxRange'i range olarak kullan
      cityRange: primaryVehicle.variant.cityRange,
      highwayRange: primaryVehicle.variant.highwayRange,
      efficiency: primaryVehicle.variant.efficiency,
      cityEfficiency: primaryVehicle.variant.cityEfficiency,
      highwayEfficiency: primaryVehicle.variant.highwayEfficiency,
      chargingSpeed: {
        ac: primaryVehicle.variant.acChargingSpeed,
        dc: primaryVehicle.variant.dcChargingSpeed
      },
      connectorTypes: primaryVehicle.variant.connectorTypes
    };
    
    res.json(vehicleWithSpecs);
  } catch (error) {
    console.error('Get primary vehicle error:', error);
    res.status(500).json({ error: 'Ana araç bilgileri alınamadı' });
  }
});

// Kullanıcının araçlarını getir (authentication gerekir) - SONRA GELMELİ
router.get('/user-vehicles', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const userVehicles = await prisma.userVehicle.findMany({
      where: { userId, isActive: true },
      include: {
        variant: {
          include: {
            model: {
              include: {
                brand: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(userVehicles);
  } catch (error) {
    console.error('Get user vehicles error:', error);
    res.status(500).json({ error: 'Kullanıcı araçları alınamadı' });
  }
});

// Kullanıcıya yeni araç ekle (authentication gerekir)
router.post('/user-vehicles', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { variantId, nickname, licensePlate, color, currentBatteryLevel } = req.body;
    
    const userVehicle = await prisma.userVehicle.create({
      data: {
        userId,
        variantId,
        nickname,
        licensePlate,
        color,
        currentBatteryLevel: currentBatteryLevel || 100
      },
      include: {
        variant: {
          include: {
            model: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    });
    
    res.status(201).json(userVehicle);
  } catch (error) {
    console.error('Create user vehicle error:', error);
    res.status(500).json({ error: 'Araç eklenemedi' });
  }
});

// Kullanıcı aracını güncelle (authentication gerekir)
router.put('/user-vehicles/:vehicleId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleId } = req.params;
    const { nickname, licensePlate, color, currentBatteryLevel } = req.body;
    
    // Aracın kullanıcıya ait olduğunu kontrol et
    const existingVehicle = await prisma.userVehicle.findFirst({
      where: { id: vehicleId, userId }
    });
    
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Araç bulunamadı' });
    }
    
    const updatedVehicle = await prisma.userVehicle.update({
      where: { id: vehicleId },
      data: {
        nickname,
        licensePlate,
        color,
        currentBatteryLevel
      },
      include: {
        variant: {
          include: {
            model: {
              include: {
                brand: true
              }
            }
          }
        }
      }
    });
    
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Update user vehicle error:', error);
    res.status(500).json({ error: 'Araç güncellenemedi' });
  }
});

// Birincil aracı ayarla (authentication gerekir)
router.put('/user-vehicle/primary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleId } = req.body;
    
    if (!vehicleId) {
      return res.status(400).json({ error: 'vehicleId gerekli' });
    }
    
    // Aracın kullanıcıya ait olduğunu kontrol et
    const existingVehicle = await prisma.userVehicle.findFirst({
      where: { id: vehicleId, userId, isActive: true }
    });
    
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Araç bulunamadı' });
    }
    
    // Önce tüm araçları non-primary yap
    await prisma.userVehicle.updateMany({
      where: { userId },
      data: { isPrimary: false }
    });
    
    // Seçilen aracı primary yap
    const updatedVehicle = await prisma.userVehicle.update({
      where: { id: vehicleId },
      data: { isPrimary: true }
    });
    
    res.json(updatedVehicle);
  } catch (error) {
    console.error('Set primary vehicle error:', error);
    res.status(500).json({ error: 'Birincil araç ayarlanamadı' });
  }
});

// Kullanıcı aracını sil (authentication gerekir)
router.delete('/user-vehicle/:vehicleId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleId } = req.params;
    
    // Aracın kullanıcıya ait olduğunu kontrol et
    const existingVehicle = await prisma.userVehicle.findFirst({
      where: { id: vehicleId, userId }
    });
    
    if (!existingVehicle) {
      return res.status(404).json({ error: 'Araç bulunamadı' });
    }
    
    // Soft delete - sadece isActive'i false yap
    await prisma.userVehicle.update({
      where: { id: vehicleId },
      data: { isActive: false }
    });
    
    res.json({ message: 'Araç başarıyla silindi' });
  } catch (error) {
    console.error('Delete user vehicle error:', error);
    res.status(500).json({ error: 'Araç silinemedi' });
  }
});

module.exports = router;
