# 🔧 Environment Variables Kurulum Rehberi

Bu rehber SarjEt projesinin environment variable'larının nasıl konfigüre edileceğini açıklar.

## 📋 Gerekli Konfigürasyonlar

### 1. 🌍 Backend URL (ZORUNLU)
```bash
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000
```

**Nasıl bulunur:**
- **macOS/Linux:** `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** `ipconfig | findstr IPv4`
- Genelde `192.168.x.x` veya `10.x.x.x` formatında

### 2. 🗺️ Mapbox Token (ZORUNLU)
```bash
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_access_token_here
```

**Nasıl alınır:**
1. https://account.mapbox.com/access-tokens/ adresine git
2. Hesap aç (ücretsiz)
3. "Create a token" butonuna tıkla
4. Token'ı kopyala

**Kullanım limiti:** Ayda 50,000 map load (ücretsiz plan)

### 3. 📍 Google Maps API Key (ZORUNLU)
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Nasıl alınır:**
1. https://console.cloud.google.com/apis/credentials adresine git
2. Proje oluştur
3. Bu API'ları aktifleştir:
   - Maps SDK for Android
   - Maps SDK for iOS  
   - Geocoding API
4. Credentials > Create Credentials > API Key
5. API Key'i kopyala

**Not:** Billing hesabı gerekebilir (küçük kullanımlar genelde ücretsiz)

### 4. ⚡ OpenChargeMap API Key (ZORUNLU)
```bash
OPENCHARGE_MAP_API_KEY=your_opencharge_map_api_key_here
```

**Nasıl alınır:**
1. https://openchargemap.org/site/develop/api adresine git
2. Ücretsiz hesap oluştur
3. API Key'i al

### 5. 🔐 JWT Secret (ZORUNLU)
```bash
JWT_SECRET=your_very_strong_jwt_secret_key_here_at_least_32_characters_long
```

**Güçlü secret oluşturma:**
```bash
# macOS/Linux
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 6. 🗄️ PostgreSQL Database (ZORUNLU)
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/sarjet_db
```

**Hızlı Docker kurulumu:**
```bash
docker run --name sarjet-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=sarjet_db \
  -p 5432:5432 -d postgres
```

## 🔄 İsteğe Bağlı Konfigürasyonlar

### Redis Cache
```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password_if_needed
```

### Email Service (Gelecek özellikler için)
```bash
SENDGRID_API_KEY=your_sendgrid_api_key_optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Analytics & Monitoring
```bash
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn_here_optional
```

## 🚀 Hızlı Başlangıç

1. **Environment dosyalarını kopyala:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

2. **Zorunlu değerleri doldur:**
   - EXPO_PUBLIC_BACKEND_URL (kendi IP'niz)
   - EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN
   - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
   - OPENCHARGE_MAP_API_KEY
   - JWT_SECRET
   - DATABASE_URL

3. **Backend'i başlat:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

4. **React Native uygulamasını başlat:**
   ```bash
   npm install
   npm start
   ```

## 🏗️ Production Deployment

Production ortamında şu değişiklikleri yap:

```bash
NODE_ENV=production
JWT_SECRET=production_da_farkli_guclu_secret
DATABASE_URL=postgresql://user:pass@prod-db:5432/sarjet_prod
EXPO_PUBLIC_BACKEND_URL=https://api.yourapp.com
LOG_LEVEL=warn
```

## 🔒 Güvenlik Notları

- **Asla** `.env` dosyalarını Git'e commit etmeyin
- JWT secret'ları production'da mutlaka değiştirin
- API key'lerinizi güvenli tutun
- Rate limiting ayarlarını production'da artırın
- HTTPS kullanın

## ❓ Sorun Giderme

### "Backend base URL is not configured" hatası
- `EXPO_PUBLIC_BACKEND_URL` değerini kontrol edin
- IP adresinin doğru olduğundan emin olun
- Backend servisinin çalıştığını kontrol edin

### Mapbox haritası yüklenmiyor
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` değerini kontrol edin
- Token'ın geçerli olduğundan emin olun
- Expo app.json dosyasındaki Mapbox konfigürasyonunu kontrol edin

### Google Maps çalışmıyor
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` değerini kontrol edin
- API'ların (Maps SDK for Android/iOS) aktif olduğundan emin olun
- Billing hesabının aktif olduğunu kontrol edin

---

Bu rehber ile SarjEt projesini başarıyla konfigüre edebilirsiniz! 🎉
