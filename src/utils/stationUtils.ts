import { ChargingStation } from '../types';

/**
 * Şarj istasyonu bilgilerini formatlamak için yardımcı fonksiyonlar
 */
export class StationUtils {
  /**
   * İstasyon durumunu Türkçe olarak döndürür
   */
  static getStationStatus(station: ChargingStation): string {
    if (!station.StatusType) return 'Durum bilinmiyor';
    
    if (station.StatusType.IsOperational) {
      return 'Aktif';
    } else {
      return 'Devre dışı';
    }
  }

  /**
   * İstasyon durumuna göre renk döndürür
   */
  static getStatusColor(station: ChargingStation): string {
    if (!station.StatusType) return '#gray';
    
    return station.StatusType.IsOperational ? '#22c55e' : '#ef4444';
  }

  /**
   * Maksimum güç bilgisini formatlar
   */
  static getMaxPower(station: ChargingStation): string {
    if (!station.Connections || station.Connections.length === 0) {
      return 'Güç bilgisi yok';
    }

    const maxPower = Math.max(
      ...station.Connections
        .filter(conn => conn.PowerKW)
        .map(conn => conn.PowerKW!)
    );

    if (maxPower === -Infinity || maxPower <= 0) {
      return 'Güç bilgisi yok';
    }

    return `${maxPower} kW`;
  }

  /**
   * Bağlantı türlerini formatlar
   */
  static getConnectionTypes(station: ChargingStation): string {
    if (!station.Connections || station.Connections.length === 0) {
      return 'Bağlantı bilgisi yok';
    }

    const types = station.Connections
      .filter(conn => conn.ConnectionType?.Title)
      .map(conn => conn.ConnectionType!.Title)
      .filter((value, index, self) => self.indexOf(value) === index); // Duplicate'leri kaldır

    return types.length > 0 ? types.join(', ') : 'Bağlantı bilgisi yok';
  }

  /**
   * Şarj hızı kategorisini belirler
   */
  static getChargingSpeed(station: ChargingStation): 'Yavaş' | 'Orta' | 'Hızlı' | 'Süper Hızlı' | 'Bilinmiyor' {
    if (!station.Connections || station.Connections.length === 0) {
      return 'Bilinmiyor';
    }

    const maxPower = Math.max(
      ...station.Connections
        .filter(conn => conn.PowerKW)
        .map(conn => conn.PowerKW!)
    );

    if (maxPower === -Infinity || maxPower <= 0) return 'Bilinmiyor';
    if (maxPower <= 7) return 'Yavaş';
    if (maxPower <= 22) return 'Orta';
    if (maxPower <= 50) return 'Hızlı';
    return 'Süper Hızlı';
  }

  /**
   * Şarj hızına göre renk döndürür
   */
  static getSpeedColor(station: ChargingStation): string {
    const speed = this.getChargingSpeed(station);
    
    switch (speed) {
      case 'Yavaş': return '#ef4444'; // Kırmızı
      case 'Orta': return '#f59e0b'; // Turuncu
      case 'Hızlı': return '#10b981'; // Yeşil
      case 'Süper Hızlı': return '#3b82f6'; // Mavi
      default: return '#6b7280'; // Gri
    }
  }

  /**
   * Adres bilgisini formatlar
   */
  static getFormattedAddress(station: ChargingStation): string {
    const addr = station.AddressInfo;
    if (!addr) return 'Adres bilgisi yok';

    const parts = [
      addr.AddressLine1,
      addr.AddressLine2,
      addr.Town,
      addr.StateOrProvince
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : addr.Title || 'Adres bilgisi yok';
  }

  /**
   * Kullanım türünü formatlar
   */
  static getUsageType(station: ChargingStation): string {
    if (!station.UsageType) return 'Kullanım bilgisi yok';

    const usageInfo = [];
    
    if (station.UsageType.IsPayAtLocation) {
      usageInfo.push('Yerinde ödeme');
    }
    
    if (station.UsageType.IsMembershipRequired) {
      usageInfo.push('Üyelik gerekli');
    }
    
    if (station.UsageType.IsAccessKeyRequired) {
      usageInfo.push('Erişim kartı gerekli');
    }

    return usageInfo.length > 0 
      ? usageInfo.join(', ') 
      : station.UsageType.Title || 'Genel kullanım';
  }

  /**
   * Mesafeyi formatlar
   */
  static formatDistance(distance?: number): string {
    if (!distance) return '';
    
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  }

  /**
   * İstasyonun ücretsiz olup olmadığını kontrol eder
   */
  static isFreeStation(station: ChargingStation): boolean {
    const title = station.AddressInfo?.Title?.toLowerCase() || '';
    const comments = station.GeneralComments?.toLowerCase() || '';
    const operatorTitle = station.OperatorInfo?.Title?.toLowerCase() || '';
    
    const freeKeywords = ['ücretsiz', 'bedava', 'free', 'gratis'];
    
    return freeKeywords.some(keyword => 
      title.includes(keyword) || 
      comments.includes(keyword) || 
      operatorTitle.includes(keyword)
    );
  }
}
