# Şarjet Kullanım Kılavuzu

## 🚀 Hızlı Başlangıç

### Uygulamayı Çalıştırma

1. **Terminal açın ve proje dizinine gidin:**
```bash
cd /Users/yusufefetasdelen/sarjet
```

2. **Expo development server'ı başlatın:**
```bash
npm start
```

3. **Platform seçin:**
   - **iOS**: `i` tuşuna basın (iOS Simulator gerekli)
   - **Android**: `a` tuşuna basın (Android Emulator gerekli)
   - **Web**: `w` tuşuna basın (tarayıcıda açılır) ⚠️ *Harita özelliği web'de desteklenmez*
   - **Fiziksel cihaz**: QR kodu Expo Go uygulaması ile tarayın

### Web için Hızlı Başlangıç

```bash
# Web platformunu temiz başlatma
npm run web:clear

# Sadece web (cache sorunları varsa)
npm run web

# Her şeyi sıfırlama (son çare)
npm run reset && npm run web
```

## 🤖 Android'de Çalıştırma (Detaylı)

### Seçenek 1: Android Emülatör (Önerilen)

1. **Android Studio Kurulumu:**
   - [Android Studio](https://developer.android.com/studio) indirin ve kurun
   - Android SDK'yı kurun

2. **AVD (Virtual Device) Oluşturma:**
   ```bash
   # Android Studio'yu açın
   # Tools > AVD Manager
   # "Create Virtual Device" tıklayın
   # Pixel 6 veya benzeri seçin
   # API Level 30+ (Android 11+) seçin
   ```

3. **Emülatörü Başlatma:**
   ```bash
   # Terminal'den (opsiyonel)
   ~/Library/Android/sdk/emulator/emulator -avd Pixel_6_API_30
   ```

4. **Şarjet Uygulamasını Açma:**
   ```bash
   cd /Users/yusufefetasdelen/sarjet
   npm start
   # Terminal'de 'a' tuşuna basın
   ```

### Seçenek 2: Fiziksel Android Cihaz

1. **Expo Go Uygulamasını İndirin:**
   - Google Play Store'dan "Expo Go" uygulamasını indirin

2. **Developer Options Aktifleştirin:**
   - Ayarlar > Telefon Hakkında > Yapı Numarası'na 7 kez tıklayın
   - Ayarlar > Developer Options > USB Debugging'i açın

3. **QR Kod Tarama:**
   ```bash
   npm start
   # Terminal'de görünen QR kodu Expo Go ile tarayın
   ```

### Gerekli İzinler

- **iOS**: Konum erişimi için "Konuma erişime izin ver" 
- **Android**: "Konum" iznini aktifleştirin

## 📱 Uygulama Kullanımı

### Ana Sayfa

1. **İlk Açılış**: Uygulama konumunuzu isteyecek
2. **Konum İzni**: "İzin Ver" seçeneğini seçin
3. **Harita Yükleniyor**: Yakındaki şarj istasyonları otomatik yüklenecek

### Harita Görünümü

- **Mavi pinler**: Şarj istasyonlarını gösterir
- **Pin renkleri**: Şarj hızına göre değişir
  - 🔴 Kırmızı: Yavaş şarj (≤7kW)
  - 🟠 Turuncu: Orta hız (8-22kW)
  - 🟢 Yeşil: Hızlı şarj (23-50kW)  
  - 🔵 Mavi: Süper hızlı (50kW+)

### İstasyon Arama

1. **Arama Çubuğu**: Şehir adı yazın (örn: "Ankara")
2. **Ara Butonu**: Tıklayarak sonuçları getirin
3. **Filtreler**: "Filtreleri Göster" ile filtreleme seçenekleri

### Filtreleme Seçenekleri

- **Mesafe**: 10km, 25km, 50km, 100km
- **Hızlı Şarj**: Sadece 50kW+ istasyonlar
- **Ücretsiz**: Sadece ücretsiz istasyonlar

### Liste Görünümü

1. **Liste Sekmesi**: Harita yerine liste görünümü
2. **Mesafe Sıralama**: En yakından en uzağa sıralı
3. **İstasyon Kartları**: Tıklayarak detaya gidin

### İstasyon Detayları

1. **İstasyon Seç**: Harita pin'ine veya liste öğesine tıklayın
2. **Detay Sayfası**: Tam bilgiler görüntülenir
3. **Yol Tarifi**: "Yol Tarifi Al" butonu ile Google Maps açılır

## 🛠️ Geliştirici Seçenekleri

### Debug Menüsü

- **iOS**: Simulator'da `Cmd+D` 
- **Android**: Emulator'da `Cmd+M` veya cihazı sallayın
- **Reload**: `Cmd+R` ile uygulamayı yeniden yükleyin

### Console Logları

```bash
# Terminal'da logları görmek için
npx expo start
```

### API Test

```javascript
// OpenChargeMap API test
curl "https://api.openchargemap.io/v3/poi?latitude=41.0082&longitude=28.9784&distance=25&maxresults=10&countrycode=TR"
```

## 🐛 Sorun Giderme

### Yaygın Sorunlar

1. **Harita görünmüyor**
   - İnternet bağlantısını kontrol edin
   - Konum iznini kontrol edin
   - Uygulamayı yeniden başlatın

2. **İstasyonlar yüklenmiyor**
   - API bağlantısını kontrol edin
   - Farklı konum deneyin
   - Filtreleri sıfırlayın

3. **Konum alınamıyor**
   - Cihaz ayarlarından konum servisini açın
   - Uygulama izinlerini kontrol edin
   - GPS sinyalini kontrol edin

### Web Platformu Hataları

- **"Cannot resolve react-native-maps"**: Normal davranış, web fallback kullanılır
- **"Harita özelliği desteklenmiyor"**: Web'de harita yerine liste görünümü kullanın  
- **Metro bundling hatası**: `npx expo start --clear` ile cache temizleyin
- **Browser compatibility warning**: Modern tarayıcı kullanın (Chrome/Firefox/Safari)

### Native Platform Hataları

- **"Konum erişim izni verilmedi"**: Ayarlar > Gizlilik > Konum'dan izin verin
- **"Şarj istasyonları yüklenemedi"**: İnternet bağlantısını kontrol edin
- **"Arama sonuçları yüklenemedi"**: Farklı arama terimi deneyin

### Cache Temizleme

```bash
# Metro cache temizleme (tüm platformlar)
npx expo start --clear

# Web spesifik temizlik
npx expo start --web --clear

# npm cache temizleme  
npm start -- --reset-cache

# Node modules yeniden kurulum (son çare)
rm -rf node_modules package-lock.json
npm install
```

## 📊 Performans İpuçları

### Optimizasyon

1. **Konum Servisleri**: Sadece gerektiğinde açın
2. **API Çağrıları**: Fazla aramadan kaçının
3. **Görsel Performans**: Çok fazla marker'dan kaçının

### Batarya Tasarrufu

- GPS'i sürekli açık bırakmayın
- Arka plan yenilemeyi kapatın
- Gerekmedikçe harita zoomlamayın

## 🔧 Yapılandırma

### API Anahtarı (Opsiyonel)

OpenChargeMap API anahtarı için:

1. `src/services/chargingStationService.ts` dosyasını açın
2. Constructor'a API key ekleyin:

```javascript
const stationService = new ChargingStationService('YOUR_API_KEY');
```

### Varsayılan Konum

İstanbul yerine farklı varsayılan konum için:

1. `src/services/locationService.ts` dosyasını açın
2. `getCurrentLocation` catch bloğunu düzenleyin

## 📈 Kullanım İstatistikleri

### Ölçülebilir Metrikler

- İstasyon arama sayısı
- Yol tarifi kullanım oranı
- En çok aranan şehirler
- Filtre kullanım oranı

## 🆘 Destek

### Hata Bildirimi

1. Hata ekran görüntüsü alın
2. Cihaz ve OS versiyonunu belirtin
3. Yapılan işlemleri açıklayın

### Feature İsteği

- GitHub Issues kullanın
- Detaylı açıklama yapın
- Varsa mockup/örnek ekleyin

---

**💡 İpucu**: En iyi deneyim için güncel iOS/Android sürümü kullanın!

## 🌐 Web Platformunda Kullanım

### Desteklenen Özellikler
- ✅ İstasyon arama ve filtreleme
- ✅ İstasyon listesi görünümü
- ✅ İstasyon detay sayfaları
- ✅ Yol tarifi (Google Maps'e yönlendirme)

### Desteklenmeyen Özellikler
- ❌ Harita görünümü (native özellik)
- ❌ GPS konum takibi (güvenlik kısıtlaması)
- ❌ Gerçek zamanlı konum güncellemeleri

### Web'de Kullanım
1. **Tarayıcıdan Açma**: `npm start` sonrası `w` tuşu
2. **Alternatif Konum**: Manuel şehir seçimi önerilir
3. **Liste Modu**: Birincil görünüm olarak liste kullanın

### Tarayıcı Uyumluluğu
- ✅ Chrome/Edge (önerilen)
- ✅ Firefox 
- ✅ Safari
- ⚠️ IE/Eski tarayıcılar desteklenmez
