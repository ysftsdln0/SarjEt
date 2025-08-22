import * as Location from 'expo-location';
import { UserLocation } from '../types';

export class LocationService {
  /**
   * Kullanıcı konumunu alır
   */
  static async getCurrentLocation(): Promise<UserLocation> {
    try {
      console.log('Konum izni isteniyor...');
      
      // Konum izni kontrolü
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('Konum izni durumu:', status);
      
      if (status !== 'granted') {
        console.warn('Konum izni verilmedi, varsayılan konum kullanılıyor');
        throw new Error('Konum erişim izni verilmedi');
      }

      console.log('Mevcut konum alınıyor...');
      
      // Mevcut konumu al - daha toleranslı ayarlar
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced, // High yerine Balanced
        timeInterval: 10000, // 10 saniye timeout
        distanceInterval: 100,
      });

      console.log('Konum başarıyla alındı:', location.coords);

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Konum alınırken hata:', error);
      console.log('Varsayılan İstanbul konumu kullanılıyor');
      
      // Hata durumunda İstanbul koordinatlarını varsayılan olarak döndür
      return {
        latitude: 41.0082,
        longitude: 28.9784,
      };
    }
  }

  /**
   * Konum izni durumunu kontrol eder
   */
  static async checkLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * İki nokta arasındaki mesafeyi hesaplar (Haversine formülü)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return Math.round(distance * 100) / 100; // 2 ondalık haneli yuvarla
  }

  /**
   * Google Maps ile yol tarifi almak için URL oluşturur
   */
  static getDirectionsUrl(
    fromLat: number,
    fromLon: number,
    toLat: number,
    toLon: number
  ): string {
    return `https://www.google.com/maps/dir/${fromLat},${fromLon}/${toLat},${toLon}`;
  }

  /**
   * Çok duraklı rota için Google Maps URL (origin, waypoints, destination)
   */
  static getDirectionsUrlMulti(
    start: { latitude: number; longitude: number },
    end: { latitude: number; longitude: number },
    waypoints?: Array<{ latitude: number; longitude: number }>
  ): string {
    const origin = `${start.latitude},${start.longitude}`;
    const destination = `${end.latitude},${end.longitude}`;
    const wp = (waypoints || [])
      .map(w => `${w.latitude},${w.longitude}`)
      .join('|');
    const base = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    return wp ? `${base}&waypoints=${encodeURIComponent(wp)}&travelmode=driving` : `${base}&travelmode=driving`;
  }
}
