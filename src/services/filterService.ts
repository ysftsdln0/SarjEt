import { ChargingStation, FilterOptions } from '../types';

export class FilterService {
  /**
   * İstasyonları filtreleme seçeneklerine göre filtreler
   */
  static applyFilters(stations: ChargingStation[], filters: FilterOptions): ChargingStation[] {
    if (__DEV__) {
       
      console.log('🔧 FilterService.applyFilters çağrıldı:', {
        stationCount: stations.length,
        filters: filters
      });
    }

    let powerFailCount = 0;
    let distanceFailCount = 0;
    let fastChargingFailCount = 0;
    let availableFailCount = 0;
    let freeFailCount = 0;
    let connectionFailCount = 0;
    let operatorFailCount = 0;

    const filteredStations = stations.filter(station => {
      // Güç filtresi
      if (!this.checkPowerFilter(station, filters)) {
        powerFailCount++;
        return false;
      }
      
      // Mesafe filtresi
      if (!this.checkDistanceFilter(station, filters)) {
        distanceFailCount++;
        return false;
      }
      
      // Hızlı şarj filtresi
      if (filters.onlyFastCharging && !this.isFastCharging(station)) {
        fastChargingFailCount++;
        return false;
      }
      
      // Müsaitlik filtresi
      if (filters.onlyAvailable && !this.isAvailable(station)) {
        availableFailCount++;
        return false;
      }
      
      // Ücretsiz filtresi
      if (filters.onlyFree && !this.isFree(station)) {
        freeFailCount++;
        return false;
      }
      
      // Konnektör tipi filtresi
      if (!this.checkConnectionTypeFilter(station, filters)) {
        connectionFailCount++;
        return false;
      }
      
      // Operatör filtresi
      if (!this.checkOperatorFilter(station, filters)) {
        operatorFailCount++;
        return false;
      }
      
      return true;
    });

    if (__DEV__) {
       
      console.log('✅ FilterService sonuç:', {
        originalCount: stations.length,
        filteredCount: filteredStations.length,
        sampleStation: filteredStations[0]?.AddressInfo?.Title || 'Yok',
        filterFailures: {
          power: powerFailCount,
          distance: distanceFailCount,
          fastCharging: fastChargingFailCount,
          available: availableFailCount,
          free: freeFailCount,
          connection: connectionFailCount,
          operator: operatorFailCount
        }
      });
    }

    return filteredStations;
  }

  /**
   * Güç filtresini kontrol et
   */
  private static checkPowerFilter(station: ChargingStation, filters: FilterOptions): boolean {
    if (filters.minPowerKW === 0 && filters.maxPowerKW === 1000) return true;
    
    const stationPower = this.getStationMaxPower(station);
    const passes = stationPower >= filters.minPowerKW && stationPower <= filters.maxPowerKW;
    
    // İlk birkaç istasyon için debug log
    if (__DEV__ && Math.random() < 0.01) { // %1 şans ile log
       
      console.log('⚡ Güç filtresi:', {
        stationName: station.AddressInfo?.Title,
        stationPower: stationPower,
        filterMin: filters.minPowerKW,
        filterMax: filters.maxPowerKW,
        passes: passes,
        connections: station.Connections?.map(c => ({ type: c.ConnectionType?.Title, power: c.PowerKW }))
      });
    }
    
    return passes;
  }

  /**
   * Mesafe filtresini kontrol et
   */
  private static checkDistanceFilter(station: ChargingStation, filters: FilterOptions): boolean {
    // Default değer 1000 olduğu için, 1000km ise filtreleme yapma
    if (filters.maxDistance >= 1000) return true;
    
    const distance = station.AddressInfo?.Distance;
    if (distance === undefined || distance === null) return true;
    
    return distance <= filters.maxDistance;
  }

  /**
   * Konnektör tipi filtresini kontrol et
   */
  private static checkConnectionTypeFilter(station: ChargingStation, filters: FilterOptions): boolean {
    if (filters.connectionTypes.length === 0) return true;
    
    const stationConnectionTypes = station.Connections?.map(conn => 
      conn.ConnectionType?.Title
    ).filter(Boolean) || [];
    
    return filters.connectionTypes.some(filterType => 
      stationConnectionTypes.includes(filterType)
    );
  }

  /**
   * Operatör filtresini kontrol et
   */
  private static checkOperatorFilter(station: ChargingStation, filters: FilterOptions): boolean {
    if (filters.operators.length === 0) return true;
    
    const stationOperator = station.OperatorInfo?.Title;
    if (!stationOperator) return false;
    
    return filters.operators.includes(stationOperator);
  }

  /**
   * İstasyonun maksimum gücünü al
   */
  private static getStationMaxPower(station: ChargingStation): number {
    if (!station.Connections || station.Connections.length === 0) return 0;
    
    const powers = station.Connections
      .map(conn => conn.PowerKW)
      .filter(power => power && power > 0) as number[];
    
    const maxPower = powers.length > 0 ? Math.max(...powers) : 0;
    
    // İlk birkaç istasyon için debug log
    if (__DEV__ && Math.random() < 0.005) { // %0.5 şans ile log
       
      console.log('🔋 İstasyon güç hesaplama:', {
        stationName: station.AddressInfo?.Title,
        connections: station.Connections?.map(c => ({ type: c.ConnectionType?.Title, power: c.PowerKW })),
        powers: powers,
        maxPower: maxPower
      });
    }
    
    return maxPower;
  }

  /**
   * İstasyonun hızlı şarj olup olmadığını kontrol et
   */
  private static isFastCharging(station: ChargingStation): boolean {
    return this.getStationMaxPower(station) >= 50;
  }

  /**
   * İstasyonun müsait olup olmadığını kontrol et
   */
  private static isAvailable(station: ChargingStation): boolean {
    return station.StatusType?.IsOperational !== false;
  }

  /**
   * İstasyonun ücretsiz olup olmadığını kontrol et
   */
  private static isFree(station: ChargingStation): boolean {
    // UsageType kontrolü
    const usageType = station.UsageType?.Title?.toLowerCase();
    if (usageType?.includes('free') || usageType?.includes('public')) return true;
    
    // OperatorInfo kontrolü
    const operatorTitle = station.OperatorInfo?.Title?.toLowerCase();
    if (operatorTitle?.includes('free') || operatorTitle?.includes('ücretsiz')) return true;
    
    // Connection level kontrolü
    const hasFreeConnection = station.Connections?.some(conn => {
      const levelTitle = conn.Level?.Title?.toLowerCase();
      return levelTitle?.includes('free') || levelTitle?.includes('ücretsiz');
    });
    
    return hasFreeConnection || false;
  }

  /**
   * Aktif filtre sayısını hesapla
   */
  static getActiveFilterCount(filters: FilterOptions): number {
    let count = 0;
    
    // Güç filtresi
    if (filters.minPowerKW > 0 || filters.maxPowerKW < 1000) count++;
    
    // Mesafe filtresi - Default değer 1000 olduğu için 1000'den küçükse aktif sayılır
    if (filters.maxDistance < 1000) count++;
    
    // Switch filtreler
    if (filters.onlyFastCharging) count++;
    if (filters.onlyAvailable) count++;
    if (filters.onlyFree) count++;
    
    // Konnektör tipi
    if (filters.connectionTypes.length > 0) count++;
    
    // Operatör
    if (filters.operators.length > 0) count++;
    
    return count;
  }

  /**
   * Filtrelerin açıklama metni
   */
  static getFilterSummary(filters: FilterOptions): string {
    const parts: string[] = [];
    
    // Güç
    if (filters.minPowerKW > 0 || filters.maxPowerKW < 1000) {
      if (filters.minPowerKW === filters.maxPowerKW) {
        parts.push(`${filters.minPowerKW}kW`);
      } else if (filters.minPowerKW > 0 && filters.maxPowerKW < 1000) {
        parts.push(`${filters.minPowerKW}-${filters.maxPowerKW}kW`);
      } else if (filters.minPowerKW > 0) {
        parts.push(`${filters.minPowerKW}kW+`);
      } else {
        parts.push(`max ${filters.maxPowerKW}kW`);
      }
    }
    
    // Mesafe - Default değer 1000 olduğu için 1000'den küçükse aktif sayılır
    if (filters.maxDistance < 1000) {
      parts.push(`${filters.maxDistance}km yakın`);
    }
    
    // Hızlı filtreler
    if (filters.onlyFastCharging) parts.push('Hızlı şarj');
    if (filters.onlyAvailable) parts.push('Müsait');
    if (filters.onlyFree) parts.push('Ücretsiz');
    
    // Konnektör
    if (filters.connectionTypes.length === 1) {
      parts.push(filters.connectionTypes[0]);
    } else if (filters.connectionTypes.length > 1) {
      parts.push(`${filters.connectionTypes.length} konnektör`);
    }
    
    // Operatör
    if (filters.operators.length === 1) {
      parts.push(filters.operators[0]);
    } else if (filters.operators.length > 1) {
      parts.push(`${filters.operators.length} operatör`);
    }
    
    return parts.join(', ');
  }

  /**
   * İstasyonları arama metnine göre filtreler
   */
  static searchStations(stations: ChargingStation[], query: string): ChargingStation[] {
    if (!query.trim()) {
      return stations; // Arama boşsa tüm istasyonları döndür
    }

    const searchText = query.toLowerCase();
    return stations.filter(station => {
      return (
        station.AddressInfo?.Title?.toLowerCase().includes(searchText) ||
        station.AddressInfo?.Town?.toLowerCase().includes(searchText) ||
        station.AddressInfo?.StateOrProvince?.toLowerCase().includes(searchText) ||
        station.OperatorInfo?.Title?.toLowerCase().includes(searchText)
      );
    });
  }

  /**
   * Default filtre seçenekleri
   */
  static getDefaultFilters(): FilterOptions {
    return {
      minPowerKW: 0,
      maxPowerKW: 1000,
      connectionTypes: [],
      operators: [],
      maxDistance: 1000, // Varsayılan 1000km - Türkiye geneli için
      onlyFastCharging: false,
      onlyAvailable: false,
      onlyFree: false,
    };
  }
}
