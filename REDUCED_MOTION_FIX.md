# Reduced Motion Support - Reanimated Warning Fix

Bu döküman, React Native Reanimated'da "Reduced motion setting is enabled" uyarısının nasıl çözüldüğünü açıklar.

## Problem

React Native Reanimated, cihazda "reduced motion" (azaltılmış hareket) ayarı etkinleştirildiğinde geliştirme modunda bir uyarı veriyor:

```
WARN [Reanimated] Reduced motion setting is enabled on this device. This warning is visible only in the development mode. Some animations will be disabled by default. You can override the behavior for individual animations.
```

## Çözüm

### 1. Animation Utilities (`src/utils/animationUtils.ts`)

Yeni bir utility sınıfı oluşturuldu:

- `AnimationUtils.checkReducedMotionEnabled()`: Cihazın reduced motion ayarını kontrol eder
- `AnimationUtils.createSpringAnimation()`: Reduced motion ayarını dikkate alan spring animasyonları
- `AnimationUtils.createTimingAnimation()`: Reduced motion ayarını dikkate alan timing animasyonları
- `AnimationUtils.getMotiAnimationConfig()`: Moti bileşenleri için animasyon konfigürasyonu

### 2. StationDetailScreen Güncellemeleri

Tüm animasyonlar güncellendi:

#### Reanimated Animasyonları
```tsx
// Önce
headerOpacity.value = withSpring(1, { duration: 800 });

// Sonra
headerOpacity.value = AnimationUtils.createSpringAnimation(1, { duration: 800 });
```

#### Moti Animasyonları
```tsx
// Helper function
const getTransitionConfig = (originalDelay = 0, durationType = 'timing', originalDuration = 600) => ({
  type: isReducedMotion ? 'timing' as const : durationType,
  duration: isReducedMotion ? 0 : originalDuration,
  delay: isReducedMotion ? 0 : originalDelay,
});

// Kullanım
<MotiView
  from={{ opacity: 0, translateY: isReducedMotion ? 0 : 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={getTransitionConfig(400, 'timing', 600)}
>
```

#### Animated.View Bileşenleri
```tsx
<Animated.View 
  entering={isReducedMotion ? undefined : FadeInDown.delay(200).duration(800)}
>
```

### 3. App.tsx Güncellemeleri

- AnimationUtils başlatılması eklendi
- LogBox'a reduced motion uyarısı eklendi

```tsx
LogBox.ignoreLogs([
  // ... diğer uyarılar
  '[Reanimated] Reduced motion setting is enabled on this device',
]);

useEffect(() => {
  AnimationUtils.initialize();
}, []);
```

## Özellikler

### Accessibility Desteği
- Cihazın reduced motion ayarı otomatik algılanır
- Animasyonlar kullanıcının tercihlerine göre devre dışı bırakılır veya hızlandırılır
- Accessibility değişiklikleri dinlenir ve güncellenir

### Performans
- Reduced motion etkinken animasyonlar duration=0 ile hemen tamamlanır
- Gereksiz animasyon hesaplamaları önlenir

### Geliştirici Deneyimi
- Uyarı mesajları LogBox ile gizlenir
- Animation utility'leri kolay kullanım için merkezi yönetim sağlar

## Kullanım Kılavuzu

### Yeni Animasyonlar Eklerken

1. **Reanimated için:**
```tsx
import { AnimationUtils } from '../utils/animationUtils';

// Spring animasyon
value.value = AnimationUtils.createSpringAnimation(targetValue, { duration: 600 });

// Timing animasyon
value.value = AnimationUtils.createTimingAnimation(targetValue, { duration: 300 });
```

2. **Moti için:**
```tsx
const [isReducedMotion, setIsReducedMotion] = useState(false);

useEffect(() => {
  AnimationUtils.getReducedMotionSetting().then(setIsReducedMotion);
}, []);

<MotiView
  from={{ opacity: 0, scale: isReducedMotion ? 1 : 0.9 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={AnimationUtils.getMotiAnimationConfig(isReducedMotion)}
>
```

3. **Animated.View için:**
```tsx
<Animated.View 
  entering={isReducedMotion ? undefined : FadeInDown.delay(200).duration(800)}
>
```

## Test Etme

### iOS Simulator'da
1. Settings > Accessibility > Motion > Reduce Motion'ı etkinleştir
2. Uygulamayı yeniden başlat
3. Animasyonların devre dışı kalacağını gözlemle

### Android Emulator'da
1. Settings > Accessibility > Remove animations'ı etkinleştir
2. Uygulamayı yeniden başlat
3. Animasyonların devre dışı kalacağını gözlemle

Bu güncellemeler sayesinde uygulama hem accessibility standartlarına uygun hem de geliştirme deneyimi açısından temiz bir hale gelmiştir.
