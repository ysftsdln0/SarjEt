const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminEmail = 'admin@sarjet.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'SarjEt Admin',
          password: hashedPassword,
          preferences: {
            create: {
              isDarkMode: true,
              notificationsEnabled: true,
              fastChargingOnly: false,
              maxDistance: 100,
              language: 'tr'
            }
          }
        }
      });

      console.log('✅ Admin user created:', admin.email);
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create test user
    const testEmail = 'test@sarjet.com';
    const existingTest = await prisma.user.findUnique({
      where: { email: testEmail }
    });

    if (!existingTest) {
      const hashedPassword = await bcrypt.hash('test123', 12);
      
      const testUser = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
          password: hashedPassword,
          preferences: {
            create: {
              isDarkMode: false,
              notificationsEnabled: true,
              fastChargingOnly: true,
              maxDistance: 50,
              language: 'tr',
              preferredConnectorTypes: ['Type 2', 'CCS'],
              preferredOperators: ['Tesla', 'ChargePoint']
            }
          }
        }
      });

      console.log('✅ Test user created:', testUser.email);
    } else {
      console.log('ℹ️  Test user already exists');
    }

    // Add some sample vehicles
    const vehicleData = [
      {
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        batteryCapacity: 75,
        range: 500,
        chargingPower: 250,
        connectorTypes: ['Type 2', 'CCS'],
        efficiency: 15
      },
      {
        make: 'BMW',
        model: 'iX',
        year: 2023,
        batteryCapacity: 105,
        range: 600,
        chargingPower: 200,
        connectorTypes: ['Type 2', 'CCS'],
        efficiency: 17.5
      },
      {
        make: 'Volkswagen',
        model: 'ID.4',
        year: 2023,
        batteryCapacity: 77,
        range: 520,
        chargingPower: 135,
        connectorTypes: ['Type 2', 'CCS'],
        efficiency: 14.8
      },
      {
        make: 'Hyundai',
        model: 'IONIQ 5',
        year: 2023,
        batteryCapacity: 77.4,
        range: 481,
        chargingPower: 350,
        connectorTypes: ['Type 2', 'CCS'],
        efficiency: 16.1
      }
    ];

    for (const vehicle of vehicleData) {
      const existing = await prisma.vehicle.findFirst({
        where: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year
        }
      });

      if (!existing) {
        await prisma.vehicle.create({ data: vehicle });
        console.log(`✅ Vehicle added: ${vehicle.make} ${vehicle.model}`);
      }
    }

    // Add system configuration
    const systemConfigs = [
      {
        key: 'OPENCHARGE_SYNC_INTERVAL',
        value: '3600',
        description: 'OpenChargeMap sync interval in seconds'
      },
      {
        key: 'CACHE_DEFAULT_TTL',
        value: '300',
        description: 'Default cache TTL in seconds'
      },
      {
        key: 'MAX_STATIONS_PER_REQUEST',
        value: '1000',
        description: 'Maximum stations returned per API request'
      },
      {
        key: 'MAINTENANCE_MODE',
        value: 'false',
        description: 'Enable maintenance mode'
      }
    ];

    for (const config of systemConfigs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value, description: config.description },
        create: config
      });
    }

    console.log('✅ System configuration added');

    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
