import { ChargingStation } from '../types';
import { EnhancedFilterOptions } from '../components/EnhancedFilterSystem';

export class EnhancedFilterService {
  private static calculateDistance(
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
    return R * c;
  }

  private static isStationOpen(station: ChargingStation): boolean {
    // Basit açık/kapalı kontrolü - StatusTypeID'ye göre
    // 50: Operational, 75: Partly Operational - bu durumlar açık kabul edilir
    if (station.StatusTypeID === 50 || station.StatusTypeID === 75) {
      return true;
    }
    
    // Diğer durumlar için genel iş saatleri varsayımı
    const now = new Date();
    const currentHour = now.getHours();
    return currentHour >= 8 && currentHour <= 22;
  }

  private static getStationPower(station: ChargingStation): number {
    if (!station.Connections || station.Connections.length === 0) return 0;
    
    const powers = station.Connections
      .map(conn => conn.PowerKW || 0)
      .filter(power => power > 0);
    
    return powers.length > 0 ? Math.max(...powers) : 0;
  }

  private static getStationConnectionTypes(station: ChargingStation): string[] {
    if (!station.Connections) return [];
    
    return station.Connections
      .filter(conn => conn.ConnectionType?.Title)
      .map(conn => conn.ConnectionType!.Title!);
  }

  private static getStationRating(station: ChargingStation): number {
    // Mock rating - gerçek implementasyon user rating sistemine göre yapılacak
    return Math.random() * 5;
  }

  private static isFastCharging(station: ChargingStation): boolean {
    const power = this.getStationPower(station);
    return power >= 50; // 50kW ve üzeri hızlı şarj kabul edilir
  }

  private static isFreeCharging(station: ChargingStation): boolean {
    // Mock implementation - gerçek pricing verisi olmadığı için basit mantık
    // OperatorID'ye göre bazı ücretsiz operatörler olabilir
    const freeOperatorIds = [1, 2, 3]; // Örnek ücretsiz operatör ID'leri
    if (station.OperatorID && freeOperatorIds.includes(station.OperatorID)) {
      return true;
    }
    
    // Genel olarak false döndür - gerçek implementasyon pricing API'ye bağlı olacak
    return false;
  }

  static applyFilters(
    stations: ChargingStation[],
    filters: EnhancedFilterOptions,
    userLocation?: { latitude: number; longitude: number } | null
  ): ChargingStation[] {
    let filteredStations = [...stations];

    // Hızlı filtreler
    if (filters.quickFilters.available) {
      filteredStations = filteredStations.filter(station => 
        station.StatusTypeID === 50 || station.StatusTypeID === 75
      );
    }

    if (filters.quickFilters.fastCharging) {
      filteredStations = filteredStations.filter(station => 
        this.isFastCharging(station)
      );
    }

    if (filters.quickFilters.free) {
      filteredStations = filteredStations.filter(station => 
        this.isFreeCharging(station)
      );
    }

    if (filters.quickFilters.nearby && userLocation) {
      filteredStations = filteredStations.filter(station => {
        if (!station.AddressInfo?.Latitude || !station.AddressInfo?.Longitude) return false;
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          station.AddressInfo.Latitude,
          station.AddressInfo.Longitude
        );
        return distance <= 10; // 10km içinde "yakın" kabul edilir
      });
    }

    // Mesafe filtresi
    if (userLocation && filters.location.useCurrentLocation) {
      filteredStations = filteredStations.filter(station => {
        if (!station.AddressInfo?.Latitude || !station.AddressInfo?.Longitude) return false;
        const distance = this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          station.AddressInfo.Latitude,
          station.AddressInfo.Longitude
        );
        return distance <= filters.location.maxDistance;
      });
    }

    // Bağlantı türü filtresi
    if (filters.charging.connectionTypes.length > 0) {
      filteredStations = filteredStations.filter(station => {
        const stationTypes = this.getStationConnectionTypes(station);
        return filters.charging.connectionTypes.some(type => 
          stationTypes.some(stationType => stationType.includes(type))
        );
      });
    }

    // Güç filtresi
    if (filters.charging.minPower > 0) {
      filteredStations = filteredStations.filter(station => {
        const power = this.getStationPower(station);
        return power >= filters.charging.minPower && power <= filters.charging.maxPower;
      });
    }

    // İşletmeci filtresi
    if (filters.business.operators.length > 0) {
      filteredStations = filteredStations.filter(station => 
        station.OperatorInfo?.Title && 
        filters.business.operators.includes(station.OperatorInfo.Title)
      );
    }

    // Ücretsiz istasyon filtresi
    if (filters.business.priceRange.free) {
      filteredStations = filteredStations.filter(station => 
        this.isFreeCharging(station)
      );
    }

    // Çalışma saati filtreleri
    if (filters.schedule.openNow) {
      filteredStations = filteredStations.filter(station => 
        this.isStationOpen(station)
      );
    }

    if (filters.schedule.twentyFourSeven) {
      filteredStations = filteredStations.filter(station => 
        // 7/24 açık istasyonları belirlemek için StatusTypeID kullanılıyor
        // Gerçek implementasyon için özel bir 24/7 flagı gerekli olabilir
        station.StatusTypeID === 50 // Operational istasyonları 7/24 kabul edilir
      );
    }

    // Değerlendirme filtresi
    if (filters.ratings.minRating > 0) {
      filteredStations = filteredStations.filter(station => 
        this.getStationRating(station) >= filters.ratings.minRating
      );
    }

    return filteredStations;
  }

  static sortStations(
    stations: ChargingStation[],
    sortBy: 'distance' | 'rating' | 'price' | 'power' | 'availability',
    order: 'asc' | 'desc',
    userLocation?: { latitude: number; longitude: number } | null
  ): ChargingStation[] {
    const sorted = [...stations];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'distance':
          if (userLocation && a.AddressInfo?.Latitude && a.AddressInfo?.Longitude &&
              b.AddressInfo?.Latitude && b.AddressInfo?.Longitude) {
            const distA = this.calculateDistance(
              userLocation.latitude, userLocation.longitude,
              a.AddressInfo.Latitude, a.AddressInfo.Longitude
            );
            const distB = this.calculateDistance(
              userLocation.latitude, userLocation.longitude,
              b.AddressInfo.Latitude, b.AddressInfo.Longitude
            );
            comparison = distA - distB;
          }
          break;

        case 'rating':
          const ratingA = this.getStationRating(a);
          const ratingB = this.getStationRating(b);
          comparison = ratingB - ratingA; // Yüksek rating önce
          break;

        case 'power':
          const powerA = this.getStationPower(a);
          const powerB = this.getStationPower(b);
          comparison = powerB - powerA; // Yüksek güç önce
          break;

        case 'availability':
          const availableA = (a.StatusTypeID === 50 || a.StatusTypeID === 75) ? 1 : 0;
          const availableB = (b.StatusTypeID === 50 || b.StatusTypeID === 75) ? 1 : 0;
          comparison = availableB - availableA; // Müsait olanlar önce
          break;

        case 'price':
          // Mock price sorting - gerçek implementasyon pricing verisine göre yapılacak
          const priceA = this.isFreeCharging(a) ? 0 : 1;
          const priceB = this.isFreeCharging(b) ? 0 : 1;
          comparison = priceA - priceB; // Ücretsiz olanlar önce
          break;
      }

      return order === 'desc' ? -comparison : comparison;
    });

    return sorted;
  }

  static getDefaultFilters(): EnhancedFilterOptions {
    return {
      quickFilters: {
        available: false,
        fastCharging: false,
        free: false,
        nearby: false,
        favorite: false,
      },
      location: {
        maxDistance: 50,
        useCurrentLocation: true,
      },
      charging: {
        connectionTypes: [],
        minPower: 0,
        maxPower: 1000,
        supportedStandards: [],
      },
      business: {
        operators: [],
        priceRange: { min: 0, max: 100, free: false },
        paymentMethods: [],
      },
      schedule: {
        openNow: false,
        twentyFourSeven: false,
      },
      ratings: {
        minRating: 0,
        hasReviews: false,
        verifiedOnly: false,
      },
      amenities: {
        parking: false,
        restroom: false,
        restaurant: false,
        wifi: false,
        shelter: false,
      },
      sorting: {
        by: 'distance',
        order: 'asc',
      },
    };
  }

  static getActiveFilterCount(filters: EnhancedFilterOptions): number {
    let count = 0;

    // Hızlı filtreler
    Object.values(filters.quickFilters).forEach(value => {
      if (value) count++;
    });

    // Bağlantı türleri
    count += filters.charging.connectionTypes.length;

    // İşletmeciler
    count += filters.business.operators.length;

    // Diğer boolean filtreler
    if (filters.business.priceRange.free) count++;
    if (filters.schedule.openNow) count++;
    if (filters.schedule.twentyFourSeven) count++;
    if (filters.ratings.minRating > 0) count++;

    // Özellikler
    Object.values(filters.amenities).forEach(value => {
      if (value) count++;
    });

    return count;
  }
}

export default EnhancedFilterService;
