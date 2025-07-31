import axios from 'axios';
import { ChargingStation } from '../types';
import { mockChargingStations, checkNetworkConnection } from '../data/mockData';

// Environment variable'dan backend URL'i al
const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.15.133:3000';
const BACKEND_URL = `${BACKEND_BASE_URL}/api/stations`;

console.log('[ChargingStationService] Backend configuration:', {
  baseUrl: BACKEND_BASE_URL,
  fullUrl: BACKEND_URL,
  envVar: process.env.EXPO_PUBLIC_BACKEND_URL
});

// SarjEt Backend servisi - OpenChargeMap cache sistemi kullanıyor
export class ChargingStationService {
  private isOffline: boolean = false;

  constructor() {
    // Backend cache sistemini kullanıyoruz, API key gerekmiyor
  }

  /**
   * Network bağlantısını kontrol et
   */
  private async checkConnection(): Promise<boolean> {
    if (this.isOffline) return false;
    
    try {
      const isConnected = await checkNetworkConnection();
      this.isOffline = !isConnected;
      return isConnected;
    } catch {
      this.isOffline = true;
      return false;
    }
  }

  /**
   * Backend cache'den yakındaki şarj istasyonlarını getirir
   */
  async getNearbyStations(
    latitude: number,
    longitude: number,
    radiusKM: number = 25,
    maxResults: number = 20
  ): Promise<ChargingStation[]> {
    // Backend radius limitini kontrol et (maksimum 500km)
    const actualRadius = Math.min(radiusKM, 500);
    const actualLimit = Math.min(maxResults, 100);
    
    // Önce bağlantıyı kontrol et
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      console.warn('İnternet bağlantısı yok, demo veriler kullanılıyor');
      return this.getMockStations(latitude, longitude, actualRadius, actualLimit);
    }

    try {
      console.log('Backend API çağrısı:', {
        url: `${BACKEND_URL}/nearby`,
        params: {
          latitude,
          longitude,
          radius: actualRadius,
          limit: actualLimit
        }
      });

      const response = await axios.get(`${BACKEND_URL}/nearby`, {
        params: {
          latitude,
          longitude,
          radius: actualRadius,
          limit: actualLimit
        },
        timeout: 10000 // 10 saniye timeout
      });

      if (response.data.success) {
        return this.transformBackendStations(response.data.data.stations);
      } else {
        throw new Error('Backend API hatası');
      }
    } catch (error: any) {
      console.error('Backend bağlantı hatası, demo veriler kullanılıyor:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      this.isOffline = true;
      return this.getMockStations(latitude, longitude, actualRadius, actualLimit);
    }
  }

  /**
   * Tüm Türkiye'deki istasyonları getirir (eski metodla uyumluluk için)
   */
  async getAllStationsInTurkey(maxResults: number = 100): Promise<ChargingStation[]> {
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      console.warn('İnternet bağlantısı yok, demo veriler kullanılıyor');
      return mockChargingStations.slice(0, maxResults);
    }

    try {
      // Backend maksimum limit 100, bu yüzden 100 ile sınırlıyoruz
      const actualLimit = Math.min(maxResults, 100);
      // Backend maksimum radius 500km, bu yüzden 450km ile sınırlıyoruz
      const maxRadius = 450;
      
      console.log('getAllStationsInTurkey çağrılıyor:', {
        requestedLimit: maxResults,
        actualLimit: actualLimit,
        coordinates: { lat: 39.9334, lng: 32.8597, radius: maxRadius }
      });
      
      // Türkiye merkezinden geniş radius ile arama (backend maksimum 500km altında)
      return await this.getNearbyStations(39.9334, 32.8597, maxRadius, actualLimit);
    } catch (error) {
      console.error('Tüm istasyonlar alınamadı, demo veriler kullanılıyor:', error);
      return mockChargingStations.slice(0, maxResults);
    }
  }

  /**
   * Şehir arama (eski metodla uyumluluk için)
   */
  async searchStationsByCity(city: string, limit: number = 30): Promise<ChargingStation[]> {
    return await this.getStationsByCity(city, limit);
  }

  /**
   * Backend'den gelen station formatını frontend formatına çevirir
   */
  private transformBackendStations(backendStations: any[]): ChargingStation[] {
    return backendStations.map(station => ({
      ID: station.ID,
      UUID: station.UUID,
      DataProviderID: station.DataProviderID,
      OperatorID: station.OperatorID,
      UsageTypeID: station.UsageTypeID,
      AddressInfo: {
        ID: station.AddressInfo.ID,
        Title: station.AddressInfo.Title,
        AddressLine1: station.AddressInfo.AddressLine1,
        Town: station.AddressInfo.Town,
        StateOrProvince: station.AddressInfo.StateOrProvince,
        Postcode: station.AddressInfo.Postcode,
        CountryID: station.AddressInfo.CountryID,
        Latitude: station.AddressInfo.Latitude,
        Longitude: station.AddressInfo.Longitude,
        Distance: station.distance || 0 // Backend'den gelen distance bilgisi
      },
      Connections: station.Connections || [],
      NumberOfPoints: station.NumberOfPoints || 1,
      StatusTypeID: station.StatusTypeID,
      GeneralComments: station.GeneralComments,
      UserComments: station.UserComments || [],
      MediaItems: station.MediaItems || [],
      IsRecentlyVerified: station.IsRecentlyVerified || false,
      DateLastVerified: station.DateLastVerified
    }));
  }

  /**
   * Şehre göre şarj istasyonlarını getirir
   */
  async getStationsByCity(
    city: string,
    limit: number = 20
  ): Promise<ChargingStation[]> {
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      console.warn('İnternet bağlantısı yok, demo veriler kullanılıyor');
      return this.getMockStationsByCity(city, limit);
    }

    try {
      const response = await axios.get(`${BACKEND_URL}/city`, {
        params: {
          city,
          limit
        },
        timeout: 10000
      });

      if (response.data.success) {
        return this.transformBackendStations(response.data.data.stations);
      } else {
        throw new Error('Backend API hatası');
      }
    } catch (error) {
      console.error('Backend bağlantı hatası, demo veriler kullanılıyor:', error);
      this.isOffline = true;
      return this.getMockStationsByCity(city, limit);
    }
  }

  /**
   * Çalışır durumda olan istasyonları filtreler
   */
  filterOperational(stations: ChargingStation[]): ChargingStation[] {
    return stations.filter(station => 
      station.StatusTypeID === 50 || // Operational
      station.StatusTypeID === 75    // Operational - Charging
    );
  }

  /**
   * Hızlı şarj istasyonlarını filtreler (>22kW)
   */
  filterFastCharging(stations: ChargingStation[]): ChargingStation[] {
    return stations.filter(station => 
      station.Connections && station.Connections.some(conn => 
        conn.PowerKW && conn.PowerKW > 22
      )
    );
  }

  /**
   * Cache durumunu kontrol et
   */
  async getCacheStatus(): Promise<any> {
    try {
      const response = await axios.get(`${BACKEND_URL}/cache/status`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('Cache status alınamadı:', error);
      return null;
    }
  }

  /**
   * Cache'i manuel olarak yenile
   */
  async refreshCache(): Promise<any> {
    try {
      const response = await axios.post(`${BACKEND_URL}/cache/refresh`, {}, {
        timeout: 30000 // Cache refresh uzun sürebilir
      });
      return response.data;
    } catch (error) {
      console.error('Cache refresh hatası:', error);
      return null;
    }
  }

  /**
   * Mock verilerden şarj istasyonlarını getirir (offline mode)
   */
  private getMockStations(
    latitude: number,
    longitude: number,
    radiusKM: number,
    maxResults: number
  ): ChargingStation[] {
    // Mesafe hesapla ve filtrele
    const stationsWithDistance = mockChargingStations.map((station: any) => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        station.AddressInfo.Latitude,
        station.AddressInfo.Longitude
      );
      
      return {
        ...station,
        AddressInfo: {
          ...station.AddressInfo,
          Distance: distance
        }
      };
    });

    return stationsWithDistance
      .filter((station: any) => station.AddressInfo.Distance <= radiusKM)
      .sort((a: any, b: any) => a.AddressInfo.Distance - b.AddressInfo.Distance)
      .slice(0, maxResults);
  }

  /**
   * Mock verilerden şehre göre istasyonları getirir
   */
  private getMockStationsByCity(city: string, limit: number): ChargingStation[] {
    return mockChargingStations
      .filter((station: any) => 
        station.AddressInfo.Town?.toLowerCase().includes(city.toLowerCase()) ||
        station.AddressInfo.StateOrProvince?.toLowerCase().includes(city.toLowerCase())
      )
      .slice(0, limit);
  }

  /**
   * İki nokta arası mesafe hesapla (Haversine formülü)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Dünya'nın yarıçapı (km)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // 1 ondalık basamak
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI/180);
  }

  /**
   * Offline durumunu kontrol et
   */
  getOfflineStatus(): boolean {
    return this.isOffline;
  }

  /**
   * Offline durumunu manuel olarak ayarla
   */
  setOfflineStatus(offline: boolean): void {
    this.isOffline = offline;
  }
}

// Default export
export default ChargingStationService;

// Singleton instance
export const chargingStationService = new ChargingStationService();
