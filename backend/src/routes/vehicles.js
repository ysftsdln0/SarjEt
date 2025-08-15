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

// Kullanıcının araçlarını getir (authentication gerekir)
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

// Kullanıcı aracını sil (authentication gerekir)
router.delete('/user-vehicles/:vehicleId', auth, async (req, res) => {
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
