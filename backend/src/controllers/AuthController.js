const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class AuthController {
  // Kullanıcı kaydı
  static async register(req, res) {
    try {
      console.log('🚀 Register endpoint called with body:', req.body);
      
      const { email, password, name, phone, vehicle } = req.body;

      // Email kontrolü
      console.log('📧 Checking if email exists:', email);
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        console.log('❌ Email already exists:', email);
        return res.status(400).json({ error: 'Bu email adresi zaten kullanılıyor' });
      }

      console.log('✅ Email is available, proceeding with registration');

      // Şifre hash'leme
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('🔐 Password hashed successfully');

      // Kullanıcı oluşturma
      console.log('👤 Creating user with data:', { name, email, phone });
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          phone,
          isActive: true,
          preferences: {
            create: {
              isDarkMode: false,
              notificationsEnabled: true,
              fastChargingOnly: false,
              maxDistance: 100,
              language: 'tr'
            }
          }
        },
        include: {
          preferences: true
        }
      });

      console.log('✅ User created successfully:', user.id);

      // Araç bilgileri varsa ekle
      if (vehicle && vehicle.variantId) {
        console.log('🚗 Adding vehicle information:', vehicle);
        try {
          await prisma.userVehicle.create({
            data: {
              userId: user.id,
              variantId: vehicle.variantId,
              nickname: vehicle.nickname,
              licensePlate: vehicle.licensePlate,
              color: vehicle.color,
              currentBatteryLevel: vehicle.currentBatteryLevel || 100
            }
          });
          console.log('✅ Vehicle added successfully');
        } catch (vehicleError) {
          console.error('❌ Vehicle creation failed:', vehicleError);
          // Araç eklenemese bile kullanıcı kaydı başarılı olsun
        }
      } else {
        console.log('ℹ️ No vehicle information provided');
      }

      // JWT token oluşturma
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );
      console.log('🎫 JWT token created successfully');

      // Kullanıcı bilgilerini döndür (şifre hariç)
      const { password: _, ...userWithoutPassword } = user;

      console.log('🎉 Registration completed successfully for user:', user.email);
      res.status(201).json({
        message: 'Kullanıcı başarıyla oluşturuldu',
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({ error: 'Kayıt işlemi başarısız', details: error.message });
    }
  }

  // Kullanıcı girişi
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Kullanıcıyı bul
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
          preferences: true,
          userVehicles: {
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
          }
        }
      });

      if (!user) {
        return res.status(401).json({ error: 'Geçersiz email veya şifre' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Hesabınız deaktif edilmiş' });
      }

      // Şifre kontrolü
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Geçersiz email veya şifre' });
      }

      // JWT token oluşturma
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Kullanıcı bilgilerini döndür (şifre hariç)
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: 'Giriş başarılı',
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Giriş işlemi başarısız' });
    }
  }

  // Kullanıcı profil bilgileri
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          preferences: true,
          userVehicles: {
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
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
      }

      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Profil bilgileri alınamadı' });
    }
  }

  // Kullanıcı profil güncelleme
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { name, phone, currentVehicle } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;

      // Kullanıcı bilgilerini güncelle
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          preferences: true,
          userVehicles: {
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
          }
        }
      });

      // Mevcut aracı güncelle veya yeni araç ekle
      if (currentVehicle) {
        if (currentVehicle.id) {
          // Mevcut aracı güncelle
          await prisma.userVehicle.update({
            where: { id: currentVehicle.id },
            data: {
              nickname: currentVehicle.nickname,
              licensePlate: currentVehicle.licensePlate,
              color: currentVehicle.color,
              currentBatteryLevel: currentVehicle.currentBatteryLevel
            }
          });
        } else if (currentVehicle.variantId) {
          // Yeni araç ekle
          await prisma.userVehicle.create({
            data: {
              userId,
              variantId: currentVehicle.variantId,
              nickname: currentVehicle.nickname,
              licensePlate: currentVehicle.licensePlate,
              color: currentVehicle.color,
              currentBatteryLevel: currentVehicle.currentBatteryLevel || 100
            }
          });
        }
      }

      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        message: 'Profil başarıyla güncellendi',
        user: userWithoutPassword
      });

    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Profil güncellenemedi' });
    }
  }

  // Kullanıcı çıkışı
  static async logout(req, res) {
    try {
      // JWT token blacklist'e eklenebilir (opsiyonel)
      // Şu an için sadece başarılı çıkış mesajı döndürüyoruz
      
      res.json({
        message: 'Başarıyla çıkış yapıldı'
      });

    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Çıkış işlemi başarısız' });
    }
  }

  // Şifre değiştirme
  static async changePassword(req, res) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Mevcut şifreyi kontrol et
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Mevcut şifre yanlış' });
      }

      // Yeni şifreyi hash'le
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Şifreyi güncelle
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      res.json({
        message: 'Şifre başarıyla değiştirildi'
      });

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Şifre değiştirilemedi' });
    }
  }
}

module.exports = AuthController;
