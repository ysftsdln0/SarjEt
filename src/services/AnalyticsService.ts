import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserBehavior {
  userId: string;
  sessionId: string;
  timestamp: number;
  action: string;
  data?: any;
}

export interface StationAnalytics {
  stationId: string;
  views: number;
  favorites: number;
  routes: number;
  ratings: number[];
  averageRating: number;
  popularHours: number[];
  lastUpdated: number;
}

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  favoriteStations: string[];
  frequentlyVisited: string[];
  preferredHours: number[];
  totalDistance: number;
  averageSessionDuration: number;
  lastActive: number;
}

export interface PopularTimeSlot {
  hour: number;
  count: number;
  percentage: number;
}

export interface ABTestResult {
  testId: string;
  variant: 'A' | 'B';
  metrics: {
    conversionRate: number;
    sessionDuration: number;
    userSatisfaction: number;
  };
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private userBehaviors: UserBehavior[] = [];
  private stationAnalytics: Map<string, StationAnalytics> = new Map();
  private userAnalytics: Map<string, UserAnalytics> = new Map();
  private abTests: Map<string, ABTestResult> = new Map();

  private constructor() {
    this.loadData();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Veri yükle
  private async loadData() {
    try {
      const [behaviors, stations, users, tests] = await Promise.all([
        AsyncStorage.getItem('userBehaviors'),
        AsyncStorage.getItem('stationAnalytics'),
        AsyncStorage.getItem('userAnalytics'),
        AsyncStorage.getItem('abTests'),
      ]);

      if (behaviors) this.userBehaviors = JSON.parse(behaviors);
      if (stations) {
        const stationsData = JSON.parse(stations);
        this.stationAnalytics = new Map(Object.entries(stationsData));
      }
      if (users) {
        const usersData = JSON.parse(users);
        this.userAnalytics = new Map(Object.entries(usersData));
      }
      if (tests) {
        const testsData = JSON.parse(tests);
        this.abTests = new Map(Object.entries(testsData));
      }
    } catch (error) {
      console.error('Analytics verisi yüklenemedi:', error);
    }
  }

  // Veri kaydet
  private async saveData() {
    try {
      await Promise.all([
        AsyncStorage.setItem('userBehaviors', JSON.stringify(this.userBehaviors)),
        AsyncStorage.setItem('stationAnalytics', JSON.stringify(Object.fromEntries(this.stationAnalytics))),
        AsyncStorage.setItem('userAnalytics', JSON.stringify(Object.fromEntries(this.userAnalytics))),
        AsyncStorage.setItem('abTests', JSON.stringify(Object.fromEntries(this.abTests))),
      ]);
    } catch (error) {
      console.error('Analytics verisi kaydedilemedi:', error);
    }
  }

  // Kullanıcı davranışı kaydet
  public trackUserBehavior(userId: string, sessionId: string, action: string, data?: any) {
    const behavior: UserBehavior = {
      userId,
      sessionId,
      timestamp: Date.now(),
      action,
      data,
    };

    this.userBehaviors.push(behavior);
    
    // Maksimum 1000 davranış sakla
    if (this.userBehaviors.length > 1000) {
      this.userBehaviors = this.userBehaviors.slice(-1000);
    }

    this.saveData();
    this.updateUserAnalytics(userId, action, data);
  }

  // İstasyon analitiklerini güncelle
  public updateStationAnalytics(stationId: string, action: 'view' | 'favorite' | 'route' | 'rating', data?: any) {
    let analytics = this.stationAnalytics.get(stationId);
    
    if (!analytics) {
      analytics = {
        stationId,
        views: 0,
        favorites: 0,
        routes: 0,
        ratings: [],
        averageRating: 0,
        popularHours: new Array(24).fill(0),
        lastUpdated: Date.now(),
      };
    }

    switch (action) {
      case 'view':
        analytics.views++;
        const hour = new Date().getHours();
        analytics.popularHours[hour]++;
        break;
      case 'favorite':
        analytics.favorites++;
        break;
      case 'route':
        analytics.routes++;
        break;
      case 'rating':
        if (data && typeof data.rating === 'number') {
          analytics.ratings.push(data.rating);
          analytics.averageRating = analytics.ratings.reduce((a, b) => a + b, 0) / analytics.ratings.length;
        }
        break;
    }

    analytics.lastUpdated = Date.now();
    this.stationAnalytics.set(stationId, analytics);
    this.saveData();
  }

  // Kullanıcı analitiklerini güncelle
  private updateUserAnalytics(userId: string, action: string, data?: any) {
    let analytics = this.userAnalytics.get(userId);
    
    if (!analytics) {
      analytics = {
        userId,
        totalSessions: 0,
        favoriteStations: [],
        frequentlyVisited: [],
        preferredHours: new Array(24).fill(0),
        totalDistance: 0,
        averageSessionDuration: 0,
        lastActive: Date.now(),
      };
    }

    switch (action) {
      case 'session_start':
        analytics.totalSessions++;
        break;
      case 'favorite_station':
        if (data?.stationId && !analytics.favoriteStations.includes(data.stationId)) {
          analytics.favoriteStations.push(data.stationId);
        }
        break;
      case 'visit_station':
        if (data?.stationId) {
          const index = analytics.frequentlyVisited.indexOf(data.stationId);
          if (index > -1) {
            analytics.frequentlyVisited.splice(index, 1);
          }
          analytics.frequentlyVisited.unshift(data.stationId);
          analytics.frequentlyVisited = analytics.frequentlyVisited.slice(0, 10); // Top 10
        }
        break;
      case 'session_end':
        if (data?.duration) {
          analytics.averageSessionDuration = 
            (analytics.averageSessionDuration + data.duration) / 2;
        }
        if (data?.distance) {
          analytics.totalDistance += data.distance;
        }
        break;
    }

    const hour = new Date().getHours();
    analytics.preferredHours[hour]++;
    analytics.lastActive = Date.now();
    
    this.userAnalytics.set(userId, analytics);
    this.saveData();
  }

  // Popüler saatleri getir
  public getPopularHours(): PopularTimeSlot[] {
    const hourCounts = new Array(24).fill(0);
    
    this.userBehaviors.forEach(behavior => {
      if (behavior.action === 'view' || behavior.action === 'visit_station') {
        const hour = new Date(behavior.timestamp).getHours();
        hourCounts[hour]++;
      }
    });

    const total = hourCounts.reduce((a, b) => a + b, 0);
    
    return hourCounts.map((count, hour) => ({
      hour,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    })).sort((a, b) => b.count - a.count);
  }

  // En popüler istasyonları getir
  public getPopularStations(limit: number = 10): StationAnalytics[] {
    return Array.from(this.stationAnalytics.values())
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  // En çok favori edilen istasyonları getir
  public getMostFavoritedStations(limit: number = 10): StationAnalytics[] {
    return Array.from(this.stationAnalytics.values())
      .sort((a, b) => b.favorites - a.favorites)
      .slice(0, limit);
  }

  // En yüksek puanlı istasyonları getir
  public getTopRatedStations(limit: number = 10): StationAnalytics[] {
    return Array.from(this.stationAnalytics.values())
      .filter(station => station.ratings.length > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, limit);
  }

  // Kullanıcı tercihlerini getir
  public getUserPreferences(userId: string): UserAnalytics | null {
    return this.userAnalytics.get(userId) || null;
  }

  // A/B test sonucu kaydet
  public recordABTestResult(testId: string, variant: 'A' | 'B', metrics: any) {
    const result: ABTestResult = {
      testId,
      variant,
      metrics: {
        conversionRate: metrics.conversionRate || 0,
        sessionDuration: metrics.sessionDuration || 0,
        userSatisfaction: metrics.userSatisfaction || 0,
      },
    };

    this.abTests.set(testId, result);
    this.saveData();
  }

  // A/B test sonuçlarını getir
  public getABTestResults(testId: string): ABTestResult | null {
    return this.abTests.get(testId) || null;
  }

  // Dönüşüm oranını hesapla
  public calculateConversionRate(action: string, targetAction: string): number {
    const totalActions = this.userBehaviors.filter(b => b.action === action).length;
    const targetActions = this.userBehaviors.filter(b => b.action === targetAction).length;
    
    return totalActions > 0 ? (targetActions / totalActions) * 100 : 0;
  }

  // Ortalama oturum süresini hesapla
  public calculateAverageSessionDuration(): number {
    const sessions = this.userBehaviors.filter(b => b.action === 'session_start');
    const sessionEnds = this.userBehaviors.filter(b => b.action === 'session_end');
    
    if (sessions.length === 0 || sessionEnds.length === 0) return 0;
    
    let totalDuration = 0;
    let validSessions = 0;
    
    sessions.forEach(session => {
      const end = sessionEnds.find(end => 
        end.userId === session.userId && 
        end.sessionId === session.sessionId &&
        end.timestamp > session.timestamp
      );
      
      if (end) {
        totalDuration += end.timestamp - session.timestamp;
        validSessions++;
      }
    });
    
    return validSessions > 0 ? totalDuration / validSessions : 0;
  }

  // Kullanıcı memnuniyet skorunu hesapla
  public calculateUserSatisfaction(): number {
    const ratings = Array.from(this.stationAnalytics.values())
      .flatMap(station => station.ratings);
    
    return ratings.length > 0 
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
      : 0;
  }

  // Rapor oluştur
  public generateReport(): any {
    return {
      totalUsers: this.userAnalytics.size,
      totalStations: this.stationAnalytics.size,
      totalBehaviors: this.userBehaviors.length,
      popularHours: this.getPopularHours(),
      popularStations: this.getPopularStations(5),
      topRatedStations: this.getTopRatedStations(5),
      conversionRate: this.calculateConversionRate('view', 'favorite'),
      averageSessionDuration: this.calculateAverageSessionDuration(),
      userSatisfaction: this.calculateUserSatisfaction(),
      lastUpdated: Date.now(),
    };
  }

  // Veriyi temizle (test için)
  public clearData() {
    this.userBehaviors = [];
    this.stationAnalytics.clear();
    this.userAnalytics.clear();
    this.abTests.clear();
    this.saveData();
  }
}

export default AnalyticsService.getInstance(); 