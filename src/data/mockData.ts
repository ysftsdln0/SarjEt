import { ChargingStation } from '../types';

// Demo/Mock şarj istasyonu verileri (internet bağlantısı olmadığında kullanılır)
export const mockChargingStations: ChargingStation[] = [
  {
    ID: 1,
    UUID: 'demo-1',
    DataProviderID: 1,
    OperatorID: 1,
    AddressInfo: {
      ID: 1,
      Title: 'İstanbul Otopark Şarj İstasyonu',
      AddressLine1: 'Taksim Meydanı',
      Town: 'Beyoğlu',
      StateOrProvince: 'İstanbul',
      Postcode: '34435',
      CountryID: 225,
      Country: { ISOCode: 'TR', Title: 'Turkey' },
      Latitude: 41.0370,
      Longitude: 28.9847,
      Distance: 2.5
    },
    Connections: [
      {
        ID: 1,
        ConnectionTypeID: 25,
        ConnectionType: { ID: 25, Title: 'Type 2 (Socket Only)' },
        StatusTypeID: 50,
        StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
        LevelID: 3,
        Level: { ID: 3, Title: 'DC Fast Charging', IsFastChargeCapable: true },
        PowerKW: 50,
        CurrentTypeID: 30,
        CurrentType: { ID: 30, Title: 'DC' }
      }
    ],
    NumberOfPoints: 4,
    StatusTypeID: 50,
    StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
    UsageTypeID: 1,
    UsageType: { ID: 1, Title: 'Public' }
  },
  {
    ID: 2,
    UUID: 'demo-2',
    DataProviderID: 1,
    OperatorID: 1,
    AddressInfo: {
      ID: 2,
      Title: 'Kadıköy Marina Şarj Noktası',
      AddressLine1: 'Kadıköy Marina',
      Town: 'Kadıköy',
      StateOrProvince: 'İstanbul',
      Postcode: '34710',
      CountryID: 225,
      Country: { ISOCode: 'TR', Title: 'Turkey' },
      Latitude: 40.9969,
      Longitude: 29.0375,
      Distance: 8.2
    },
    Connections: [
      {
        ID: 2,
        ConnectionTypeID: 25,
        ConnectionType: { ID: 25, Title: 'Type 2 (Socket Only)' },
        StatusTypeID: 50,
        StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
        LevelID: 2,
        Level: { ID: 2, Title: 'Level 2: Medium (Over 2kW)', IsFastChargeCapable: false },
        PowerKW: 22,
        CurrentTypeID: 20,
        CurrentType: { ID: 20, Title: 'AC (Three-Phase)' }
      }
    ],
    NumberOfPoints: 2,
    StatusTypeID: 50,
    StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
    UsageTypeID: 1,
    UsageType: { ID: 1, Title: 'Public' }
  },
  {
    ID: 3,
    UUID: 'demo-3',
    DataProviderID: 1,
    OperatorID: 1,
    AddressInfo: {
      ID: 3,
      Title: 'Levent Business Center',
      AddressLine1: 'Büyükdere Caddesi',
      Town: 'Şişli',
      StateOrProvince: 'İstanbul',
      Postcode: '34394',
      CountryID: 225,
      Country: { ISOCode: 'TR', Title: 'Turkey' },
      Latitude: 41.0814,
      Longitude: 29.0092,
      Distance: 12.1
    },
    Connections: [
      {
        ID: 3,
        ConnectionTypeID: 32,
        ConnectionType: { ID: 32, Title: 'CCS (Type 2)' },
        StatusTypeID: 50,
        StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
        LevelID: 3,
        Level: { ID: 3, Title: 'DC Fast Charging', IsFastChargeCapable: true },
        PowerKW: 150,
        CurrentTypeID: 30,
        CurrentType: { ID: 30, Title: 'DC' }
      }
    ],
    NumberOfPoints: 6,
    StatusTypeID: 50,
    StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
    UsageTypeID: 1,
    UsageType: { ID: 1, Title: 'Public' }
  },
  {
    ID: 4,
    UUID: 'demo-4',
    DataProviderID: 1,
    OperatorID: 1,
    AddressInfo: {
      ID: 4,
      Title: 'Atatürk Havalimanı Şarj İstasyonu',
      AddressLine1: 'Atatürk Havalimanı',
      Town: 'Bakırköy',
      StateOrProvince: 'İstanbul',
      Postcode: '34149',
      CountryID: 225,
      Country: { ISOCode: 'TR', Title: 'Turkey' },
      Latitude: 40.9769,
      Longitude: 28.8169,
      Distance: 15.3
    },
    Connections: [
      {
        ID: 4,
        ConnectionTypeID: 25,
        ConnectionType: { ID: 25, Title: 'Type 2 (Socket Only)' },
        StatusTypeID: 50,
        StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
        LevelID: 2,
        Level: { ID: 2, Title: 'Level 2: Medium (Over 2kW)', IsFastChargeCapable: false },
        PowerKW: 11,
        CurrentTypeID: 20,
        CurrentType: { ID: 20, Title: 'AC (Single-Phase)' }
      }
    ],
    NumberOfPoints: 8,
    StatusTypeID: 50,
    StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
    UsageTypeID: 1,
    UsageType: { ID: 1, Title: 'Public' }
  },
  {
    ID: 5,
    UUID: 'demo-5',
    DataProviderID: 1,
    OperatorID: 1,
    AddressInfo: {
      ID: 5,
      Title: 'Beşiktaş İskele Şarj Noktası',
      AddressLine1: 'Beşiktaş İskelesi',
      Town: 'Beşiktaş',
      StateOrProvince: 'İstanbul',
      Postcode: '34353',
      CountryID: 225,
      Country: { ISOCode: 'TR', Title: 'Turkey' },
      Latitude: 41.0422,
      Longitude: 29.0067,
      Distance: 5.8
    },
    Connections: [
      {
        ID: 5,
        ConnectionTypeID: 32,
        ConnectionType: { ID: 32, Title: 'CCS (Type 2)' },
        StatusTypeID: 50,
        StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
        LevelID: 3,
        Level: { ID: 3, Title: 'DC Fast Charging', IsFastChargeCapable: true },
        PowerKW: 75,
        CurrentTypeID: 30,
        CurrentType: { ID: 30, Title: 'DC' }
      }
    ],
    NumberOfPoints: 3,
    StatusTypeID: 50,
    StatusType: { Title: 'Operational', IsOperational: true, IsUserSelectable: true },
    UsageTypeID: 1,
    UsageType: { ID: 1, Title: 'Public' }
  }
];

// Bağlantı durumu kontrol fonksiyonu
export const checkNetworkConnection = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Basit network check - 5 saniye timeout
    const timeout = setTimeout(() => resolve(false), 5000);
    
    fetch('https://api.openchargemap.io/v3/poi?maxresults=1', {
      method: 'GET',
      mode: 'no-cors'
    })
      .then(() => {
        clearTimeout(timeout);
        resolve(true);
      })
      .catch(() => {
        clearTimeout(timeout);
        resolve(false);
      });
  });
};
