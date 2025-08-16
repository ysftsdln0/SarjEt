### Ortam Değişkenleri
- Frontend için backend taban URL’sini .env dosyasına ekleyin:

```bash
echo "EXPO_PUBLIC_BACKEND_URL=http://<AG_TAKIP_IPINIZ>:3000" > .env
```

Not: Backend’in yerel IP’sini görmek için backend’i çalıştırdıktan sonra `GET /api/network-info` veya `GET /health` uçlarını kullanabilirsiniz.
### Ortam Değişkenleri
- Frontend için backend taban URL’sini .env dosyasına ekleyin:

```bash
echo "EXPO_PUBLIC_BACKEND_URL=http://<AG_TAKIP_IPINIZ>:3000" > .env
```

Not: Backend’in yerel IP’sini görmek için backend’i çalıştırdıktan sonra `GET /api/network-info` veya `GET /health` uçlarını kullanabilirsiniz.
# Şarjet Uygulaması Kullanım Kılavuzu

## Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- npm veya yarn
- Expo CLI
- iOS Simulator (iOS için) veya Android Emulator (Android için)

### Kurulum Adımları
1. **Bağımlılıkları yükleyin:**
```bash
npm install
# veya
yarn install
```

2. **Expo development server'ı başlatın:**
```bash
npx expo start
```

3. **Uygulamayı çalıştırın:**
   - iOS için: `i` tuşuna basın veya iOS Simulator'da açın
   - Android için: `a` tuşuna basın veya Android Emulator'da açın
   - Fiziksel cihaz için: Expo Go uygulamasıyla QR kodu tarayın

## Android Simulator Kullanımı

1. Android Studio'yu indirin ve kurun
2. Sarjet klasörüne gidin
3. Sağdaki sidebar'dan simulatorler kısmından Pixel 9'u seçin ve ekleyin
4. Emulatörü başlatın
5. Terminalde sırasıyla şu komutları çalıştırın:
   ```bash
   npm install
   npx expo start
   ```
6. Menü çıktıktan sonra `a` tuşuna basın
   (Expo Go otomatik olarak indirilip uygulama başlatılacaktır)

## Konum Ayarlama

### Konumu İstanbul'a Almak İçin:
```bash
adb shell "am startservice -e longitude 28.9784 -e latitude 41.0082 -a com.android.gps.ENABLE_GPS com.android.gps/.GpsLocationProvider"
```

### Farklı Bir Konum Ayarlamak İçin:
```bash
adb shell "am startservice -e longitude [LONGITUDE] -e latitude [LATITUDE] -a com.android.gps.ENABLE_GPS com.android.gps/.GpsLocationProvider"
```

## Uygulama Özellikleri

### Harita Görünümü
- Yakındaki şarj istasyonlarını harita üzerinde görüntüleyin
- İstasyonları filtreleyin (güç, mesafe, konnektör tipi, vb.)
- İstasyon detaylarını görmek için marker'a tıklayın

### Liste Görünümü
- Şarj istasyonlarını liste şeklinde görüntüleyin
- Mesafe ve diğer bilgilere göre sıralama yapın

### Arama ve Filtreleme
- İstasyonları isim, adres, konum veya diğer özelliklerine göre arayın
- Gelişmiş filtreleme seçenekleri ile ihtiyacınıza uygun istasyonları bulun

### Profil ve Ayarlar
- Kullanıcı profili oluşturun ve düzenleyin
- Tema ayarlarını değiştirin (koyu/açık)
- Bildirim tercihlerinizi ayarlayın

### Rota Planlama
- Başlangıç ve hedef nokta seçin
- Rota üzerinde şarj istasyonları ekleyin
- Farklı ulaşım yöntemleri ile rota oluşturun

## Sorun Giderme

### Konum İzni Sorunları
1. Uygulamanın konum iznine sahip olduğundan emin olun
2. Cihazınızın GPS'inin açık olduğundan emin olun
3. Emulator ayarlarından konum servislerini kontrol edin

### Uygulama Yükleme Sorunları
1. `node_modules` klasörünü ve `package-lock.json` dosyasını silin
2. Tekrar `npm install` komutunu çalıştırın
3. `npx expo start --clear` komutu ile cache'i temizleyin

### Performans Sorunları
1. Filtreleme seçeneklerini kullanarak gösterilen istasyon sayısını azaltın
2. Uygulamayı yeniden başlatın
3. Emulator'ü yeniden başlatın

## Geri Bildirim ve Destek

Uygulama ile ilgili sorunlar veya öneriler için lütfen GitHub reposuna issue açın veya geliştiriciyle iletişime geçin.