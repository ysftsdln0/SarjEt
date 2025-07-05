# Şarjet - Elektrikli Araç Şarj İstasyonu Bulucu

Şarjet, Türkiye'deki elektrikli araç şarj istasyonlarını kolayca bulmanızı sağlayan bir React Native + Expo mobil uygulamasıdır.

## 🚗 Özellikler

### Ana Özellikler
- **Konum Tabanlı Arama**: GPS konumunuza göre yakındaki şarj istasyonlarını bulur
- **İnteraktif Harita**: React Native Maps ile görsel harita deneyimi
- **Detaylı İstasyon Bilgileri**: Güç, hız, bağlantı türü, operatör bilgileri
- **Yol Tarifi**: Google Maps entegrasyonu ile istasyona yol tarifi
- **Akıllı Filtreleme**: Hızlı şarj, ücretsiz istasyonlar, mesafe filtresi

### Gelişmiş Özellikler
- **Çoklu Görünüm**: Harita ve liste görünümü arasında geçiş
- **Arama Fonksiyonu**: Şehir adına göre istasyon arama
- **Durum Kontrolü**: Aktif/devre dışı istasyon durumu
- **Mesafe Hesaplama**: Gerçek zamanlı mesafe bilgisi
- **Modern UI/UX**: Sade ve kullanıcı dostu arayüz

## 🛠️ Teknoloji Stack

- **Framework**: React Native 0.79.5 + Expo SDK 53
- **Navigation**: React Navigation 6
- **Maps**: React Native Maps
- **Location**: Expo Location
- **API**: OpenChargeMap API
- **Language**: TypeScript
- **Styling**: StyleSheet (Native)

## 📱 Kurulum

### Gereksinimler
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator / Fiziksel cihaz

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone <repo-url>
cd sarjet
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Uygulamayı başlatın**
```bash
npm start
```

4. **Platform seçin**
- iOS: `i` tuşuna basın
- Android: `a` tuşuna basın  
- Web: `w` tuşuna basın

## 🗂️ Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── MapComponent.tsx     # Harita bileşeni
│   ├── SearchComponent.tsx  # Arama ve filtre bileşeni
│   └── StationList.tsx      # İstasyon liste bileşeni
├── screens/             # Ekran bileşenleri
│   ├── HomeScreen.tsx       # Ana sayfa
│   └── StationDetailScreen.tsx # İstasyon detay sayfası
├── services/            # API ve servis katmanı
│   ├── chargingStationService.ts # OpenChargeMap API
│   └── locationService.ts       # Konum servisleri
├── utils/               # Yardımcı fonksiyonlar
│   └── stationUtils.ts      # İstasyon formatlama
├── types/               # TypeScript tip tanımları
│   └── index.ts             # Ana tipler
└── navigation/          # Navigasyon yapısı
    └── AppNavigator.tsx     # Stack navigator
```

## 🌐 API Entegrasyonu

### OpenChargeMap API
- **Endpoint**: `https://api.openchargemap.io/v3/poi`
- **Kullanım**: Türkiye'deki şarj istasyonu verileri
- **Özellikler**: Konum bazlı arama, filtreleme, detaylı bilgiler

### Veri Türleri
- İstasyon konumu ve adresi
- Güç bilgileri (kW)
- Bağlantı türleri (Type 2, CCS, CHAdeMO)
- Operatör bilgileri
- Durum bilgisi (aktif/devre dışı)
- Kullanım koşulları

## 🎨 UI/UX Tasarım Prensipleri

### Renk Paleti
- **Primary**: #3b82f6 (Mavi)
- **Success**: #22c55e (Yeşil)
- **Warning**: #f59e0b (Turuncu)  
- **Error**: #ef4444 (Kırmızı)
- **Gray**: #6b7280

### Tipografi
- **Başlıklar**: 18-28px, Bold
- **Alt başlıklar**: 16px, SemiBold
- **Body text**: 14px, Regular
- **Caption**: 12px, Medium

## 🚀 Geliştirme

### Scripts
```bash
npm start          # Expo development server
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

### Debug
- Expo DevTools kullanın
- React Native Debugger entegrasyonu
- Console.log ile debug

## 📋 Özellik Listesi

### ✅ Tamamlanan
- [x] Ana sayfa harita görünümü
- [x] İstasyon listesi görünümü
- [x] Konum tabanlı arama
- [x] İstasyon detay sayfası
- [x] Arama ve filtreleme
- [x] Yol tarifi entegrasyonu
- [x] Responsive tasarım

### 🔄 Geliştirilmekte
- [ ] Favoriler özelliği
- [ ] Kullanıcı yorumları
- [ ] Çoklu dil desteği
- [ ] Offline mod

### 📝 Gelecek Özellikler
- [ ] Push notification
- [ ] Rezervasyon sistemi
- [ ] QR kod okuyucu
- [ ] Sosyal paylaşım

## 🐛 Bilinen Sorunlar

1. **Web sürümünde harita**: React Native Maps web desteği sınırlı
2. **Android izinler**: İlk açılışta konum izni gerekli
3. **API limiti**: OpenChargeMap ücretsiz plan limitleri

## 🤝 Katkı

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Developer**: Yusuf Efetasdelen
- **Email**: [email]
- **GitHub**: [github-profile]

## 🙏 Teşekkürler

- OpenChargeMap API için açık veri sağladığı için
- React Native ve Expo topluluğuna
- Tüm açık kaynak katkı sağlayıcılara

---

**Not**: Bu uygulama MVP (Minimum Viable Product) sürümüdür. Sürekli geliştirme altındadır.
