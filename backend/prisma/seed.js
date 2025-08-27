const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Araç veri tabanı seed verisi
const vehicleData = {
  brands: [
    {
      name: 'Tesla',
      country: 'USA',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Tesla_logo.png',
      website: 'https://www.tesla.com',
      models: [
        {
          name: 'Model 3',
          category: 'Sedan',
          bodyType: '4 kapı',
          startYear: 2017,
          variants: [
            {
              name: 'Standard Range',
              year: 2024,
              batteryCapacity: 60,
              usableCapacity: 57.5,
              maxRange: 409,
              cityRange: 450,
              highwayRange: 350,
              power: 175,
              torque: 350,
              acceleration: 6.1,
              topSpeed: 225,
              efficiency: 15.6,
              cityEfficiency: 14.2,
              highwayEfficiency: 17.8,
              maxACCharging: 11,
              maxDCCharging: 170,
              chargingPort: 'Tesla Supercharger + Type 2',
              connectorTypes: JSON.stringify(['Type 2', 'CCS', 'Tesla Supercharger']),
              chargingTime: {
                'AC 11kW': '5.5 saat',
                'DC 170kW': '27 dakika (10-80%)'
              },
              length: 4694,
              width: 1850,
              height: 1443,
              wheelbase: 2875,
              weight: 1764,
              cargoVolume: 425,
              basePrice: 1250000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['Autopilot', '15" touchscreen', 'Glass roof', 'Wireless charging']
            },
            {
              name: 'Long Range',
              year: 2024,
              batteryCapacity: 82,
              usableCapacity: 78.8,
              maxRange: 576,
              cityRange: 620,
              highwayRange: 500,
              power: 324,
              torque: 440,
              acceleration: 4.4,
              topSpeed: 233,
              efficiency: 15.6,
              cityEfficiency: 14.2,
              highwayEfficiency: 17.8,
              maxACCharging: 11,
              maxDCCharging: 250,
              chargingPort: 'Tesla Supercharger + Type 2',
              connectorTypes: JSON.stringify(['Type 2', 'CCS', 'Tesla Supercharger']),
              chargingTime: {
                'AC 11kW': '7.5 saat',
                'DC 250kW': '27 dakika (10-80%)'
              },
              length: 4694,
              width: 1850,
              height: 1443,
              wheelbase: 2875,
              weight: 1844,
              cargoVolume: 425,
              basePrice: 1450000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['Autopilot', '15" touchscreen', 'Glass roof', 'Premium audio', 'Heated seats']
            },
            {
              name: 'Performance',
              year: 2024,
              batteryCapacity: 82,
              usableCapacity: 78.8,
              maxRange: 507,
              cityRange: 550,
              highwayRange: 440,
              power: 377,
              torque: 660,
              acceleration: 3.3,
              topSpeed: 261,
              efficiency: 16.7,
              cityEfficiency: 15.2,
              highwayEfficiency: 19.1,
              maxACCharging: 11,
              maxDCCharging: 250,
              chargingPort: 'Tesla Supercharger + Type 2',
              connectorTypes: JSON.stringify(['Type 2', 'CCS', 'Tesla Supercharger']),
              chargingTime: {
                'AC 11kW': '7.5 saat',
                'DC 250kW': '27 dakika (10-80%)'
              },
              length: 4694,
              width: 1850,
              height: 1443,
              wheelbase: 2875,
              weight: 1844,
              cargoVolume: 425,
              basePrice: 1650000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['Autopilot', '15" touchscreen', 'Glass roof', 'Premium audio', 'Track mode', 'Performance brakes']
            }
          ]
        },
        {
          name: 'Model Y',
          category: 'SUV',
          bodyType: '5 kapı',
          startYear: 2020,
          variants: [
            {
              name: 'Standard Range',
              year: 2024,
              batteryCapacity: 60,
              usableCapacity: 57.5,
              maxRange: 394,
              cityRange: 430,
              highwayRange: 340,
              power: 175,
              torque: 350,
              acceleration: 6.9,
              topSpeed: 217,
              efficiency: 16.1,
              cityEfficiency: 14.7,
              highwayEfficiency: 18.2,
              maxACCharging: 11,
              maxDCCharging: 170,
              chargingPort: 'Tesla Supercharger + Type 2',
              connectorTypes: JSON.stringify(['Type 2', 'CCS', 'Tesla Supercharger']),
              chargingTime: {
                'AC 11kW': '5.5 saat',
                'DC 170kW': '27 dakika (10-80%)'
              },
              length: 4750,
              width: 1921,
              height: 1624,
              wheelbase: 2890,
              weight: 1929,
              cargoVolume: 854,
              basePrice: 1350000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['Autopilot', '15" touchscreen', 'Glass roof', '7 koltuk opsiyonu', 'Tow hitch']
            },
            {
              name: 'Long Range',
              year: 2024,
              batteryCapacity: 82,
              usableCapacity: 78.8,
              maxRange: 531,
              cityRange: 580,
              highwayRange: 470,
              power: 324,
              torque: 440,
              acceleration: 5.0,
              topSpeed: 217,
              efficiency: 16.1,
              cityEfficiency: 14.7,
              highwayEfficiency: 18.2,
              maxACCharging: 11,
              maxDCCharging: 250,
              chargingPort: 'Tesla Supercharger + Type 2',
              connectorTypes: JSON.stringify(['Type 2', 'CCS', 'Tesla Supercharger']),
              chargingTime: {
                'AC 11kW': '7.5 saat',
                'DC 250kW': '27 dakika (10-80%)'
              },
              length: 4750,
              width: 1921,
              height: 1624,
              wheelbase: 2890,
              weight: 1997,
              cargoVolume: 854,
              basePrice: 1550000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['Autopilot', '15" touchscreen', 'Glass roof', 'Premium audio', 'Heated seats', '7 koltuk opsiyonu']
            },
            {
              name: 'Performance',
              year: 2024,
              batteryCapacity: 82,
              usableCapacity: 78.8,
              maxRange: 488,
              cityRange: 530,
              highwayRange: 430,
              power: 377,
              torque: 660,
              acceleration: 3.7,
              topSpeed: 250,
              efficiency: 17.1,
              cityEfficiency: 15.6,
              highwayEfficiency: 19.6,
              maxACCharging: 11,
              maxDCCharging: 250,
              chargingPort: 'Tesla Supercharger + Type 2',
              connectorTypes: JSON.stringify(['Type 2', 'CCS', 'Tesla Supercharger']),
              chargingTime: {
                'AC 11kW': '7.5 saat',
                'DC 250kW': '27 dakika (10-80%)'
              },
              length: 4750,
              width: 1921,
              height: 1624,
              wheelbase: 2890,
              weight: 1997,
              cargoVolume: 854,
              basePrice: 1750000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['Autopilot', '15" touchscreen', 'Glass roof', 'Premium audio', 'Track mode', 'Performance brakes', '21" wheels']
            }
          ]
        }
      ]
    },
    {
      name: 'BMW',
      country: 'Germany',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg',
      website: 'https://www.bmw.com.tr',
      models: [
        {
          name: 'iX',
          category: 'SUV',
          bodyType: '5 kapı',
          startYear: 2021,
          variants: [
            {
              name: 'xDrive50',
              year: 2024,
              batteryCapacity: 111.5,
              usableCapacity: 105.2,
              maxRange: 630,
              cityRange: 680,
              highwayRange: 550,
              power: 385,
              torque: 765,
              acceleration: 4.6,
              topSpeed: 200,
              efficiency: 17.7,
              cityEfficiency: 16.1,
              highwayEfficiency: 20.1,
              maxACCharging: 22,
              maxDCCharging: 195,
              chargingPort: 'Type 2 + CCS',
              connectorTypes: JSON.stringify(['Type 2', 'CCS']),
              chargingTime: {
                'AC 22kW': '5.5 saat',
                'DC 195kW': '35 dakika (10-80%)'
              },
              length: 4953,
              width: 1967,
              height: 1695,
              wheelbase: 3000,
              weight: 2440,
              cargoVolume: 500,
              basePrice: 3500000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['iDrive 8', 'Curved display', 'Natural interaction', 'Shy tech', 'Panoramic roof']
            },
            {
              name: 'M60',
              year: 2024,
              batteryCapacity: 111.5,
              usableCapacity: 105.2,
              maxRange: 566,
              cityRange: 610,
              highwayRange: 500,
              power: 455,
              torque: 1100,
              acceleration: 3.8,
              topSpeed: 250,
              efficiency: 20.3,
              cityEfficiency: 18.5,
              highwayEfficiency: 23.1,
              maxACCharging: 22,
              maxDCCharging: 195,
              chargingPort: 'Type 2 + CCS',
              connectorTypes: JSON.stringify(['Type 2', 'CCS']),
              chargingTime: {
                'AC 22kW': '5.5 saat',
                'DC 195kW': '35 dakika (10-80%)'
              },
              length: 4953,
              width: 1967,
              height: 1695,
              wheelbase: 3000,
              weight: 2580,
              cargoVolume: 500,
              basePrice: 4200000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['iDrive 8', 'Curved display', 'Natural interaction', 'Shy tech', 'M Sport package', '21" wheels']
            }
          ]
        },
        {
          name: 'i4',
          category: 'Sedan',
          bodyType: '4 kapı',
          startYear: 2021,
          variants: [
            {
              name: 'eDrive40',
              year: 2024,
              batteryCapacity: 83.9,
              usableCapacity: 81.2,
              maxRange: 590,
              cityRange: 640,
              highwayRange: 520,
              power: 250,
              torque: 430,
              acceleration: 5.7,
              topSpeed: 190,
              efficiency: 16.1,
              cityEfficiency: 14.6,
              highwayEfficiency: 18.2,
              maxACCharging: 11,
              maxDCCharging: 180,
              chargingPort: 'Type 2 + CCS',
              connectorTypes: JSON.stringify(['Type 2', 'CCS']),
              chargingTime: {
                'AC 11kW': '8.5 saat',
                'DC 180kW': '31 dakika (10-80%)'
              },
              length: 4783,
              width: 1852,
              height: 1448,
              wheelbase: 2856,
              weight: 2100,
              cargoVolume: 470,
              basePrice: 2800000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['iDrive 8', 'Curved display', 'BMW Live Cockpit Professional', 'Sport seats']
            }
          ]
        }
      ]
    },
    {
      name: 'Mercedes-Benz',
      country: 'Germany',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg',
      website: 'https://www.mercedes-benz.com.tr',
      models: [
        {
          name: 'EQS',
          category: 'Sedan',
          bodyType: '4 kapı',
          startYear: 2021,
          variants: [
            {
              name: '450+',
              year: 2024,
              batteryCapacity: 107.8,
              usableCapacity: 100.8,
              maxRange: 784,
              cityRange: 850,
              highwayRange: 680,
              power: 245,
              torque: 568,
              acceleration: 6.2,
              topSpeed: 210,
              efficiency: 15.9,
              cityEfficiency: 14.4,
              highwayEfficiency: 18.1,
              maxACCharging: 22,
              maxDCCharging: 200,
              chargingPort: 'Type 2 + CCS',
              chargingTime: {
                'AC 22kW': '5.5 saat',
                'DC 200kW': '31 dakika (10-80%)'
              },
              length: 5227,
              width: 1926,
              height: 1512,
              wheelbase: 3210,
              weight: 2480,
              cargoVolume: 610,
              basePrice: 4500000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['MBUX Hyperscreen', 'MBUX Interior Assist', 'ENERGIZING Comfort', 'Panoramic roof']
            }
          ]
        },
        {
          name: 'EQE',
          category: 'Sedan',
          bodyType: '4 kapı',
          startYear: 2022,
          variants: [
            {
              name: '350+',
              year: 2024,
              batteryCapacity: 90.6,
              usableCapacity: 84.6,
              maxRange: 669,
              cityRange: 720,
              highwayRange: 590,
              power: 215,
              torque: 565,
              acceleration: 6.4,
              topSpeed: 210,
              efficiency: 16.2,
              cityEfficiency: 14.7,
              highwayEfficiency: 18.4,
              maxACCharging: 22,
              maxDCCharging: 170,
              chargingPort: 'Type 2 + CCS',
              chargingTime: {
                'AC 22kW': '5.5 saat',
                'DC 170kW': '32 dakika (10-80%)'
              },
              length: 4946,
              width: 1906,
              height: 1493,
              wheelbase: 3030,
              weight: 2340,
              cargoVolume: 430,
              basePrice: 3200000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['MBUX', 'MBUX Interior Assist', 'ENERGIZING Comfort', 'Digital Light']
            }
          ]
        }
      ]
    },
    {
      name: 'Audi',
      country: 'Germany',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/92/Audi-Logo_2016.svg',
      website: 'https://www.audi.com.tr',
      models: [
        {
          name: 'e-tron',
          category: 'SUV',
          bodyType: '5 kapı',
          startYear: 2018,
          variants: [
            {
              name: '55 quattro',
              year: 2024,
              batteryCapacity: 95,
              usableCapacity: 86.5,
              maxRange: 436,
              cityRange: 480,
              highwayRange: 380,
              power: 300,
              torque: 664,
              acceleration: 5.7,
              topSpeed: 200,
              efficiency: 19.8,
              cityEfficiency: 18.0,
              highwayEfficiency: 22.3,
              maxACCharging: 22,
              maxDCCharging: 150,
              chargingPort: 'Type 2 + CCS',
              chargingTime: {
                'AC 22kW': '4.5 saat',
                'DC 150kW': '30 dakika (10-80%)'
              },
              length: 4901,
              width: 1935,
              height: 1616,
              wheelbase: 2928,
              weight: 2490,
              cargoVolume: 660,
              basePrice: 3800000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['Virtual Cockpit', 'MMI Navigation plus', 'Matrix LED headlights', 'Bang & Olufsen sound']
            }
          ]
        }
      ]
    },
    {
      name: 'Volkswagen',
      country: 'Germany',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9d/Volkswagen_logo_2019.svg',
      website: 'https://www.volkswagen.com.tr',
      models: [
        {
          name: 'ID.4',
          category: 'SUV',
          bodyType: '5 kapı',
          startYear: 2020,
          variants: [
            {
              name: 'Pro Performance',
              year: 2024,
              batteryCapacity: 77,
              usableCapacity: 74,
              maxRange: 520,
              cityRange: 570,
              highwayRange: 450,
              power: 150,
              torque: 310,
              acceleration: 8.5,
              topSpeed: 160,
              efficiency: 17.4,
              cityEfficiency: 15.8,
              highwayEfficiency: 19.8,
              maxACCharging: 11,
              maxDCCharging: 135,
              chargingPort: 'Type 2 + CCS',
              chargingTime: {
                'AC 11kW': '7.5 saat',
                'DC 135kW': '35 dakika (10-80%)'
              },
              length: 4584,
              width: 1852,
              height: 1640,
              wheelbase: 2765,
              weight: 2120,
              cargoVolume: 543,
              basePrice: 1800000,
              currency: 'TL',
              safetyRating: '5 yıldız',
              features: ['ID.Light', 'ID.Drive', 'Travel Assist', 'Park Assist Plus']
            }
          ]
        }
      ]
    }
  ]
};

async function seedVehicleDatabase() {
  console.log('🚗 Araç veri tabanı oluşturuluyor...');
  
  try {
    for (const brandData of vehicleData.brands) {
      // Marka oluştur
      const brand = await prisma.vehicleBrand.upsert({
        where: { name: brandData.name },
        update: {},
        create: {
          name: brandData.name,
          country: brandData.country,
          logo: brandData.logo,
          website: brandData.website
        }
      });
      
      console.log(`✅ ${brand.name} markası oluşturuldu`);
      
      for (const modelData of brandData.models) {
        // Model oluştur
        const model = await prisma.vehicleModel.upsert({
          where: { 
            brandId_name: { 
              brandId: brand.id, 
              name: modelData.name 
            } 
          },
          update: {},
          create: {
            brandId: brand.id,
            name: modelData.name,
            category: modelData.category,
            bodyType: modelData.bodyType,
            startYear: modelData.startYear,
            endYear: modelData.endYear,
            isElectric: modelData.isElectric,
            isHybrid: modelData.isHybrid
          }
        });
        
        console.log(`  📱 ${model.name} modeli oluşturuldu`);
        
        for (const variantData of modelData.variants) {
          // Varyant oluştur
          await prisma.vehicleVariant.upsert({
            where: {
              modelId_name_year: {
                modelId: model.id,
                name: variantData.name,
                year: variantData.year
              }
            },
            update: {},
            create: {
              modelId: model.id,
              name: variantData.name,
              year: variantData.year,
              batteryCapacity: variantData.batteryCapacity,
              usableCapacity: variantData.usableCapacity,
              maxRange: variantData.maxRange,
              cityRange: variantData.cityRange,
              highwayRange: variantData.highwayRange,
              power: variantData.power,
              torque: variantData.torque,
              acceleration: variantData.acceleration,
              topSpeed: variantData.topSpeed,
              efficiency: variantData.efficiency,
              cityEfficiency: variantData.cityEfficiency,
              highwayEfficiency: variantData.highwayEfficiency,
              maxACCharging: variantData.maxACCharging,
              maxDCCharging: variantData.maxDCCharging,
              chargingPort: variantData.chargingPort,
              chargingTime: variantData.chargingTime,
              connectorTypes: variantData.connectorTypes || ['Type 2', 'CCS'],
              length: variantData.length,
              width: variantData.width,
              height: variantData.height,
              wheelbase: variantData.wheelbase,
              weight: variantData.weight,
              cargoVolume: variantData.cargoVolume,
              basePrice: variantData.basePrice,
              currency: variantData.currency,
              safetyRating: variantData.safetyRating,
              features: variantData.features
            }
          });
          
          console.log(`    ⚡ ${variantData.name} (${variantData.year}) varyantı oluşturuldu`);
        }
      }
    }
    
    console.log('🎉 Araç veri tabanı başarıyla oluşturuldu!');
    
    // İstatistikleri göster
    const brandCount = await prisma.vehicleBrand.count();
    const modelCount = await prisma.vehicleModel.count();
    const variantCount = await prisma.vehicleVariant.count();
    
    console.log(`📊 Veritabanı istatistikleri:`);
    console.log(`   - Marka: ${brandCount}`);
    console.log(`   - Model: ${modelCount}`);
    console.log(`   - Varyant: ${variantCount}`);
    
  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedVehicleDatabase();
  } catch (error) {
    console.error('Seed işlemi başarısız:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { seedVehicleDatabase };
