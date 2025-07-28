import { ChargingStation } from '../types';

// Demo amaçlı mock şarj istasyonları
export const mockChargingStations: ChargingStation[] = [
  {
    ID: 1,
    UUID: "mock-uuid-1",
    DataProviderID: 1,
    OperatorID: 1,
    UsageTypeID: 1,
    AddressInfo: {
      ID: 1,
      Title: "Demo Şarj İstasyonu - Taksim",
      AddressLine1: "Taksim Meydanı",
      Town: "İstanbul",
      StateOrProvince: "İstanbul",
      Postcode: "34437",
      CountryID: 229,
      Latitude: 41.0369,
      Longitude: 28.9851,
      Distance: 0
    },
    Connections: [
      {
        ID: 1,
        ConnectionTypeID: 33,
        StatusTypeID: 50,
        LevelID: 3,
        PowerKW: 50,
        CurrentTypeID: 30,
        Quantity: 2
      }
    ],
    NumberOfPoints: 1,
    StatusTypeID: 50,
    GeneralComments: "Demo şarj istasyonu",
    UserComments: [],
    MediaItems: [],
    IsRecentlyVerified: true,
    DateLastVerified: new Date().toISOString()
  },
  {
    ID: 2,
    UUID: "mock-uuid-2", 
    DataProviderID: 1,
    OperatorID: 1,
    UsageTypeID: 1,
    AddressInfo: {
      ID: 2,
      Title: "Demo Şarj İstasyonu - Beşiktaş",
      AddressLine1: "Barbaros Bulvarı",
      Town: "İstanbul",
      StateOrProvince: "İstanbul", 
      Postcode: "34349",
      CountryID: 229,
      Latitude: 41.0422,
      Longitude: 29.0094,
      Distance: 0
    },
    Connections: [
      {
        ID: 2,
        ConnectionTypeID: 25,
        StatusTypeID: 50,
        LevelID: 2,
        PowerKW: 22,
        CurrentTypeID: 10,
        Quantity: 1
      }
    ],
    NumberOfPoints: 1,
    StatusTypeID: 50,
    GeneralComments: "Demo şarj istasyonu",
    UserComments: [],
    MediaItems: [],
    IsRecentlyVerified: true,
    DateLastVerified: new Date().toISOString()
  }
];

// Network bağlantısını kontrol et
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    // React Native'de network kontrolü için basit bir fetch test'i
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://www.google.com', {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    return false;
  }
};
