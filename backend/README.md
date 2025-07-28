# SarjEt Backend API

SarjEt uygulamasının Node.js + Prisma + PostgreSQL backend servisidir.

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin
```bash
cd backend
npm install
```

### 2. Environment Dosyasını Oluşturun
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyerek gerekli konfigürasyonları yapın:
- `DATABASE_URL`: PostgreSQL bağlantı string'i
- `JWT_SECRET`: JWT token şifreleme anahtarı
- `OPENCHARGE_MAP_API_KEY`: OpenChargeMap API anahtarı

### 3. Veritabanını Hazırlayın
```bash
# Prisma migration'ları çalıştır
npm run prisma:migrate

# Prisma client'ı generate et
npm run prisma:generate

# Seed data'yı ekle (opsiyonel)
npm run prisma:seed
```

### 4. Servisi Başlatın
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Kullanıcı kayıt
- `POST /api/auth/login` - Kullanıcı giriş
- `POST /api/auth/logout` - Kullanıcı çıkış
- `GET /api/auth/me` - Kullanıcı profili
- `POST /api/auth/refresh` - Token yenile

### Charging Stations
- `GET /api/stations` - İstasyonları listele (filtreleme ile)
- `GET /api/stations/:id` - Tekil istasyon detayı
- `GET /api/stations/operators` - Operatör listesi
- `GET /api/stations/connector-types` - Konnektör tipi listesi
- `POST /api/stations/sync` - OpenChargeMap'ten senkronizasyon (admin)

### Users (Protected)
- `GET /api/users/profile` - Kullanıcı profili
- `PUT /api/users/profile` - Profil güncelle
- `GET /api/users/preferences` - Kullanıcı tercihleri
- `PUT /api/users/preferences` - Tercihleri güncelle
- `GET /api/users/favorites` - Favori istasyonlar
- `POST /api/users/favorites` - Favori ekle
- `DELETE /api/users/favorites/:id` - Favori kaldır

### Health Check
- `GET /health` - Servis durumu

## 🗄️ Veritabanı Modeli

### Ana Tablolar:
- **Users**: Kullanıcı bilgileri
- **UserPreferences**: Kullanıcı tercihleri ve ayarları
- **ChargingStations**: Şarj istasyonları (OpenChargeMap cache)
- **StationConnections**: İstasyon konnektörleri
- **FavoriteStations**: Kullanıcı favori istasyonları
- **ChargingSessions**: Şarj seansları geçmişi
- **Vehicles**: Elektrikli araç bilgileri
- **SavedRoutes**: Kaydedilmiş rotalar

## 🔧 Geliştirme

### Prisma Commands
```bash
# Yeni migration oluştur
npm run prisma:migrate

# Prisma Studio aç (veritabanı GUI)
npm run prisma:studio

# Schema değişikliklerini uygula
npm run prisma:generate
```

### Loglama
- Winston kullanılıyor
- Development: Console output
- Production: Dosya logging (`logs/` klasörü)

### Cache
- Redis destekli (opsiyonel)
- Memory fallback
- Istasyon verileri için cache

### Güvenlik
- JWT authentication
- Rate limiting
- Helmet security headers
- CORS konfigürasyonu
- Prisma ORM (SQL injection koruması)

## 🌐 Dış API Entegrasyonları

### OpenChargeMap API
- Şarj istasyonu verileri
- Düzenli senkronizasyon
- Cache mekanizması

### MapBox API (Gelecek)
- Rota planlama
- Harita servisleri

### EVDatabase API (Gelecek)
- Elektrikli araç spesifikasyonları

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Logs
```bash
# Real-time log takibi
tail -f logs/combined.log

# Error logs
tail -f logs/error.log
```

## 🔐 Güvenlik

### Environment Variables
Hassas bilgileri `.env` dosyasında tutun:
- Database credentials
- API keys
- JWT secrets

### Rate Limiting
- 15 dakikada 100 istek/IP
- Konfigüre edilebilir

### Authentication
- JWT token tabanlı
- Session yönetimi
- Token refresh mekanizması

## 🚀 Production Deployment

### Environment Setup
```bash
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
```

### Database Migration
```bash
npm run prisma:deploy
```

### Process Management
PM2 veya Docker kullanılması önerilir.

## 📈 Performance

### Caching Strategy
- API responses: 5 dakika
- Station data: 1 saat
- Static data: 24 saat

### Database Optimization
- Index'ler optimize edilmiş
- Query optimization
- Connection pooling

## 🐛 Troubleshooting

### Common Issues

**Prisma Connection Error:**
```bash
# Database URL'i kontrol edin
echo $DATABASE_URL

# Migration'ları çalıştırın
npm run prisma:migrate
```

**JWT Token Error:**
```bash
# JWT_SECRET'i kontrol edin
echo $JWT_SECRET
```

**OpenChargeMap API Error:**
```bash
# API key'i kontrol edin
echo $OPENCHARGE_MAP_API_KEY
```

## 📞 Support

Backend ile ilgili sorular için:
- Issues: GitHub repository
- Email: backend@sarjet.com
