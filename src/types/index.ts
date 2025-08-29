// Harita bölgesi
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// Şarj istasyonu veri türleri
export interface ChargingStation {
  ID: number;
  UUID: string;
  DataProviderID?: number;
  OperatorID?: number;
  UsageTypeID?: number;
  AddressInfo: {
    ID: number;
    Title: string;
    AddressLine1?: string;
    AddressLine2?: string;
    Town?: string;
    StateOrProvince?: string;
    Postcode?: string;
    CountryID: number;
    Country?: {
      ISOCode: string;
      Title: string;
    };
    Latitude: number;
    Longitude: number;
    Distance?: number;
    DistanceUnit?: number;
  };
  Connections?: Connection[];
  NumberOfPoints?: number;
  GeneralComments?: string;
  DatePlanned?: string;
  DateLastConfirmed?: string;
  StatusTypeID?: number;
  StatusType?: {
    IsOperational: boolean;
    IsUserSelectable: boolean;
    Title: string;
  };
  DateLastStatusUpdate?: string;
  DataQualityLevel?: number;
  DateCreated?: string;
  SubmissionStatusTypeID?: number;
  OperatorInfo?: {
    WebsiteURL?: string;
    Comments?: string;
    PhonePrimaryContact?: string;
    PhoneSecondaryContact?: string;
    IsPrivateIndividual?: boolean;
    AddressInfo?: {
      ID: number;
      Title: string;
      AddressLine1?: string;
      AddressLine2?: string;
      Town?: string;
      StateOrProvince?: string;
      Postcode?: string;
      CountryID: number;
      Latitude?: number;
      Longitude?: number;
    };
    BookingURL?: string;
    ContactEmail?: string;
    FaultReportEmail?: string;
    IsRestrictedEdit?: boolean;
    ID: number;
    Title: string;
  };
  UsageType?: {
    IsPayAtLocation?: boolean;
    IsMembershipRequired?: boolean;
    IsAccessKeyRequired?: boolean;
    ID: number;
    Title: string;
  };
  UserComments?: Array<{
    ID?: number;
    Comment?: string;
    Rating?: number;
    UserName?: string;
    CommentDate?: string;
  }>;
  MediaItems?: Array<{
    ID?: number;
    ItemURL?: string;
    ItemThumbnailURL?: string;
    Comment?: string;
    ItemType?: string;
  }>;
  IsRecentlyVerified?: boolean;
  DateLastVerified?: string;
}

export interface Connection {
  ID: number;
  ConnectionTypeID: number;
  ConnectionType?: {
    FormalName?: string;
    IsDiscontinued?: boolean;
    IsObsolete?: boolean;
    ID: number;
    Title: string;
  };
  Reference?: string;
  StatusTypeID?: number;
  StatusType?: {
    IsOperational: boolean;
    IsUserSelectable: boolean;
    Title: string;
  };
  LevelID?: number;
  Level?: {
    Comments?: string;
    IsFastChargeCapable?: boolean;
    ID: number;
    Title: string;
  };
  Amps?: number;
  Voltage?: number;
  PowerKW?: number;
  CurrentTypeID?: number;
  CurrentType?: {
    Description?: string;
    ID: number;
    Title: string;
  };
  Quantity?: number;
}

// Navigasyon türleri
export type RootStackParamList = {
  Home: undefined;
  StationDetail: { station: ChargingStation };
  Login: undefined;
  Register: undefined;
};

// Arama filtreleri
export interface SearchFilters {
  query: string;
  maxDistance: number;
  fastChargeOnly: boolean;
  freeOnly: boolean;
}

// Kullanıcı konumu
export interface UserLocation {
  latitude: number;
  longitude: number;
}

// Temel filtre seçenekleri
export interface FilterOptions {
  minPowerKW: number;
  maxPowerKW: number;
  connectionTypes: string[];
  operators: string[];
  maxDistance: number;
  onlyFastCharging: boolean;
  onlyAvailable: boolean;
  onlyFree: boolean;
}

// Auth and user types
export interface UserPreferences {
  id: string;
  isDarkMode?: boolean;
  notificationsEnabled?: boolean;
  fastChargingOnly?: boolean;
  maxDistance?: number;
  language?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  avatar?: string;
  isActive?: boolean;
  preferences?: UserPreferences | null;
  userVehicles?: Array<{
    id: string;
    nickname?: string;
    licensePlate?: string;
    color?: string;
    currentBatteryLevel?: number;
    variant?: {
      id: string;
      name?: string;
      year?: number;
      model?: { name?: string; brand?: { name?: string } };
      maxRange?: number;
    } | null;
  }>;
}
