// Şarj istasyonu veri türleri
export interface ChargingStation {
  ID: number;
  UUID: string;
  DataProviderID: number;
  OperatorID: number;
  UsageTypeID: number;
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
    AddressInfo?: any;
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
