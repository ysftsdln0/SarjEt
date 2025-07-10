import axios from 'axios';
import { ChargingStation } from '../types';
import { mockChargingStations, checkNetworkConnection } from '../data/mockData';

const BASE_URL = 'https://api.openchargemap.io/v3/poi';

// OpenChargeMap API servisi
export class ChargingStationService {
  private apiKey: string;
  private isOffline: boolean = false;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || ''; // Opsiyonel API key
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
   * Belirli bir konum etrafındaki şarj istasyonlarını getirir
   * İnternet yoksa mock data kullanır
   */
  async getNearbyStations(
    latitude: number,
    longitude: number,
    radiusKM: number = 25,
    maxResults: number = 100
  ): Promise<ChargingStation[]> {
    // Önce bağlantıyı kontrol et
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      console.warn('İnternet bağlantısı yok, demo veriler kullanılıyor');
      return this.getMockStations(latitude, longitude, radiusKM, maxResults);
    }

    try {
      const params: any = {
        latitude,
        longitude,
        distance: radiusKM,
        distanceunit: 'KM',
        maxresults: maxResults,
        output: 'json',
        compact: false,
        verbose: false,
        countrycode: 'TR', // Türkiye için filtre
      };

      // API key varsa ekle
      if (this.apiKey) {
        params.key = this.apiKey;
      }

      console.log('🌐 OpenChargeMap API çağrısı:', { 
        url: BASE_URL, 
        params,
        hasApiKey: !!this.apiKey 
      });

      const response = await axios.get(BASE_URL, { params });
      
      console.log('📡 API Response:', {
        status: response.status,
        dataLength: response.data?.length || 0,
        sampleStation: response.data?.[0]?.AddressInfo?.Title || 'Yok'
      });
      
      return response.data as ChargingStation[];
    } catch (error) {
      console.error('❌ API Hatası:', error);
      if (axios.isAxiosError(error)) {
        console.error('API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      console.warn('🔄 API hatası, demo veriler kullanılıyor');
      return this.getMockStations(latitude, longitude, radiusKM, maxResults);
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
    console.log('🔄 Mock data kullanılıyor:', { latitude, longitude, radiusKM, maxResults });
    
    // Mock data'yı kopyala ve mesafeleri hesapla
    const stationsWithDistance = mockChargingStations.map(station => {
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

    // Mesafeye göre filtrele ve sırala
    const filteredStations = stationsWithDistance
      .filter(station => station.AddressInfo.Distance <= radiusKM)
      .sort((a, b) => a.AddressInfo.Distance - b.AddressInfo.Distance)
      .slice(0, maxResults);

    console.log('📍 Mock data sonucu:', {
      totalMockStations: mockChargingStations.length,
      stationsInRange: filteredStations.length,
      nearestStation: filteredStations[0]?.AddressInfo?.Title || 'Yok'
    });

    return filteredStations;
  }

  /**
   * İki koordinat arasındaki mesafeyi hesaplar (km)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Şehir adına göre şarj istasyonlarını arar
   */
  async searchStationsByCity(
    city: string,
    maxResults: number = 50
  ): Promise<ChargingStation[]> {
    // Önce bağlantıyı kontrol et
    const isConnected = await this.checkConnection();
    
    if (!isConnected) {
      console.warn('İnternet bağlantısı yok, demo veriler kullanılıyor');
      return this.searchMockStationsByCity(city, maxResults);
    }

    try {
      const params: any = {
        output: 'json',
        maxresults: maxResults,
        compact: false,
        verbose: false,
        countrycode: 'TR',
      };

      if (this.apiKey) {
        params.key = this.apiKey;
      }

      const response = await axios.get(BASE_URL, { params });
      const allStations = response.data as ChargingStation[];

      // Şehir adına göre filtrele
      return allStations.filter(station => 
        station.AddressInfo?.Town?.toLowerCase().includes(city.toLowerCase()) ||
        station.AddressInfo?.Title?.toLowerCase().includes(city.toLowerCase())
      );
    } catch (error) {
      console.error('Şehir araması sırasında hata:', error);
      console.warn('API hatası, demo veriler kullanılıyor');
      return this.searchMockStationsByCity(city, maxResults);
    }
  }

  /**
   * Mock verilerden şehir araması yapar
   */
  private searchMockStationsByCity(city: string, maxResults: number): ChargingStation[] {
    return mockChargingStations
      .filter(station => 
        station.AddressInfo?.StateOrProvince?.toLowerCase().includes(city.toLowerCase()) ||
        station.AddressInfo?.Town?.toLowerCase().includes(city.toLowerCase()) ||
        station.AddressInfo?.Title?.toLowerCase().includes(city.toLowerCase())
      )
      .slice(0, maxResults);
  }

  /**
   * Operator adına göre filtreler
   */
  filterByOperator(stations: ChargingStation[], operatorName: string): ChargingStation[] {
    return stations.filter(station => 
      station.OperatorInfo?.Title?.toLowerCase().includes(operatorName.toLowerCase())
    );
  }

  /**
   * Hızlı şarj istasyonlarını filtreler (50kW ve üzeri)
   */
  filterFastCharging(stations: ChargingStation[]): ChargingStation[] {
    return stations.filter(station => 
      station.Connections?.some(conn => 
        conn.PowerKW && conn.PowerKW >= 50
      )
    );
  }

  /**
   * Operasyonel istasyonları filtreler
   */
  filterOperational(stations: ChargingStation[]): ChargingStation[] {
    return stations.filter(station => 
      station.StatusType?.IsOperational !== false
    );
  }
}
