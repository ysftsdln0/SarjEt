## ANDROID SIMULATOR İÇİN (SIRASIYLA)
    0. ANDROID STUDIO İNDİRİLMELİ
    1. sarjet klasörne gir
    2. sağdaki sidebaki simulatorler kısmından pixel 9 u ekle
    3. emulatörü başlat
    4. terminalde sırasıyla
        a. npm install
        b. npx expo start
        c. menü çıktıktan sonra a ya bas
        (kendisi expo go yu indirip uygulamayı  başlatacak)

## KONUMU İSTANBULA ALMAK İÇİN TERMİNALE YAZ
    adb shell "am startservice -e longitude 28.9784 -e latitude 41.0082 -a com.android.gps.ENABLE_GPS com.android.gps/.GpsLocationProvider"
