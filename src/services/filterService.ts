import { ChargingStation } from '../types';
import { FilterOptions } from '../components/FilterModal';

export class FilterService {
  /**
   * İstasyonları filtreleme seçeneklerine göre filtreler
   */
  static applyFilters(stations: ChargingStation[], filters: FilterOptions): ChargingStation[] {
    return stations.filter(station => {
      // Güç filtresi
      if (!this.checkPowerFilter(station, filters)) return false;
      
      // Mesafe filtresi
      if (!this.checkDistanceFilter(station, filters)) return false;
      
      // Hızlı şarj filtresi
      if (filters.onlyFastCharging && !this.isFastCharging(station)) return false;
      
      // Müsaitlik filtresi
      if (filters.onlyAvailable && !this.isAvailable(station)) return false;
      
      // Ücretsiz filtresi
      if (filters.onlyFree && !this.isFree(station)) return false;
      
      // Konnektör tipi filtresi
      if (!this.checkConnectionTypeFilter(station, filters)) return false;
      
      // Operatör filtresi
      if (!this.checkOperatorFilter(station, filters)) return false;
      
      return true;
    });
  }

  /**
   * Güç filtresini kontrol et
   */
  private static checkPowerFilter(station: ChargingStation, filters: FilterOptions): boolean {
    if (filters.minPowerKW === 0 && filters.maxPowerKW === 1000) return true;
    
    const stationPower = this.getStationMaxPower(station);
    return stationPower >= filters.minPowerKW && stationPower <= filters.maxPowerKW;
  }

  /**
   * Mesafe filtresini kontrol et
   */
  private static checkDistanceFilter(station: ChargingStation, filters: FilterOptions): boolean {
    if (filters.maxDistance === 10000) return true;
    
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
    
    return powers.length > 0 ? Math.max(...powers) : 0;
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
    
    // Mesafe filtresi
    if (filters.maxDistance < 10000) count++;
    
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
    
    // Mesafe
    if (filters.maxDistance < 10000) {
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
   * Default filtre seçenekleri
   */
  static getDefaultFilters(): FilterOptions {
    return {
      minPowerKW: 0,
      maxPowerKW: 1000,
      connectionTypes: [],
      operators: [],
      maxDistance: 10000,
      onlyFastCharging: false,
      onlyAvailable: false,
      onlyFree: false,
    };
  }
}
