import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChargingStation } from '../types';

export interface NotificationSettings {
  favorites: boolean;
  chargingComplete: boolean;
  newStations: boolean;
  priceChanges: boolean;
  maintenance: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;   // HH:mm format
  };
}

export interface NotificationItem {
  id: string;
  type: 'favorite' | 'charging' | 'newStation' | 'price' | 'maintenance';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationItem[] = [];
  private settings: NotificationSettings = {
    favorites: true,
    chargingComplete: true,
    newStations: true,
    priceChanges: false,
    maintenance: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
  };

  private constructor() {
    this.loadSettings();
    this.loadNotifications();
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Ayarları yükle
  private async loadSettings() {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error('Bildirim ayarları yüklenemedi:', error);
    }
  }

  // Ayarları kaydet
  public async saveSettings(settings: Partial<NotificationSettings>) {
    try {
      this.settings = { ...this.settings, ...settings };
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Bildirim ayarları kaydedilemedi:', error);
    }
  }

  // Bildirimleri yükle
  private async loadNotifications() {
    try {
      const savedNotifications = await AsyncStorage.getItem('notifications');
      if (savedNotifications) {
        this.notifications = JSON.parse(savedNotifications);
      }
    } catch (error) {
      console.error('Bildirimler yüklenemedi:', error);
    }
  }

  // Bildirimleri kaydet
  private async saveNotifications() {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Bildirimler kaydedilemedi:', error);
    }
  }

  // Favori istasyonda yer açıldığında bildirim
  public async notifyFavoriteStationAvailable(station: ChargingStation) {
    if (!this.settings.favorites || this.isQuietHours()) return;

    const notification: NotificationItem = {
      id: `favorite-${station.ID}-${Date.now()}`,
      type: 'favorite',
      title: 'Favori İstasyonda Yer Açıldı!',
      message: `${station.AddressInfo?.Title || 'İstasyon'} artık müsait. Hemen rezervasyon yapın!`,
      data: { stationId: station.ID },
      timestamp: Date.now(),
      read: false,
      actionUrl: `station://${station.ID}`,
    };

    await this.addNotification(notification);
    this.showLocalNotification(notification);
  }

  // Şarj tamamlandığında bildirim
  public async notifyChargingComplete(station: ChargingStation, duration: number, cost: number) {
    if (!this.settings.chargingComplete || this.isQuietHours()) return;

    const notification: NotificationItem = {
      id: `charging-${station.ID}-${Date.now()}`,
      type: 'charging',
      title: 'Şarj Tamamlandı!',
      message: `${station.AddressInfo?.Title || 'İstasyon'}'da şarj işlemi tamamlandı. Süre: ${duration} dk, Ücret: ${cost} ₺`,
      data: { stationId: station.ID, duration, cost },
      timestamp: Date.now(),
      read: false,
      actionUrl: `station://${station.ID}`,
    };

    await this.addNotification(notification);
    this.showLocalNotification(notification);
  }

  // Yeni istasyon eklendiğinde bildirim
  public async notifyNewStation(station: ChargingStation, distance: number) {
    if (!this.settings.newStations || this.isQuietHours()) return;

    const notification: NotificationItem = {
      id: `new-${station.ID}-${Date.now()}`,
      type: 'newStation',
      title: 'Yeni Şarj İstasyonu!',
      message: `${station.AddressInfo?.Title || 'Yeni istasyon'} sadece ${distance.toFixed(1)} km uzakta. Hemen keşfedin!`,
      data: { stationId: station.ID, distance },
      timestamp: Date.now(),
      read: false,
      actionUrl: `station://${station.ID}`,
    };

    await this.addNotification(notification);
    this.showLocalNotification(notification);
  }

  // Fiyat değişikliği bildirimi
  public async notifyPriceChange(station: ChargingStation, oldPrice: number, newPrice: number) {
    if (!this.settings.priceChanges || this.isQuietHours()) return;

    const priceDiff = newPrice - oldPrice;
    const changeText = priceDiff > 0 ? 'arttı' : 'azaldı';

    const notification: NotificationItem = {
      id: `price-${station.ID}-${Date.now()}`,
      type: 'price',
      title: 'Fiyat Değişikliği!',
      message: `${station.AddressInfo?.Title || 'İstasyon'}'da fiyat ${changeText}. Yeni fiyat: ${newPrice} ₺/kWh`,
      data: { stationId: station.ID, oldPrice, newPrice },
      timestamp: Date.now(),
      read: false,
      actionUrl: `station://${station.ID}`,
    };

    await this.addNotification(notification);
    this.showLocalNotification(notification);
  }

  // Bakım bildirimi
  public async notifyMaintenance(station: ChargingStation, estimatedDuration: string) {
    if (!this.settings.maintenance || this.isQuietHours()) return;

    const notification: NotificationItem = {
      id: `maintenance-${station.ID}-${Date.now()}`,
      type: 'maintenance',
      title: 'Bakım Bildirimi',
      message: `${station.AddressInfo?.Title || 'İstasyon'} bakım nedeniyle geçici olarak kapalı. Tahmini süre: ${estimatedDuration}`,
      data: { stationId: station.ID, estimatedDuration },
      timestamp: Date.now(),
      read: false,
      actionUrl: `station://${station.ID}`,
    };

    await this.addNotification(notification);
    this.showLocalNotification(notification);
  }

  // Bildirim ekle
  private async addNotification(notification: NotificationItem) {
    this.notifications.unshift(notification);
    
    // Maksimum 100 bildirim sakla
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    await this.saveNotifications();
  }

  // Bildirimleri getir
  public getNotifications(): NotificationItem[] {
    return this.notifications;
  }

  // Okunmamış bildirim sayısı
  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Bildirimi okundu olarak işaretle
  public async markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      await this.saveNotifications();
    }
  }

  // Tüm bildirimleri okundu olarak işaretle
  public async markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    await this.saveNotifications();
  }

  // Bildirimi sil
  public async deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    await this.saveNotifications();
  }

  // Tüm bildirimleri sil
  public async clearAllNotifications() {
    this.notifications = [];
    await this.saveNotifications();
  }

  // Sessiz saat kontrolü
  private isQuietHours(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Gece yarısını geçen saatler için
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Local notification göster (React Native'in Alert API'si ile)
  private showLocalNotification(notification: NotificationItem) {
    // TODO: Implement actual local notification using expo-notifications
    console.log('Local Notification:', notification.title, notification.message);
  }

  // Ayarları getir
  public getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Test bildirimi
  public async sendTestNotification() {
    const testNotification: NotificationItem = {
      id: `test-${Date.now()}`,
      type: 'favorite',
      title: 'Test Bildirimi',
      message: 'Bu bir test bildirimidir. Bildirim sistemi çalışıyor!',
      timestamp: Date.now(),
      read: false,
    };

    await this.addNotification(testNotification);
    this.showLocalNotification(testNotification);
  }
}

export default NotificationService.getInstance(); 