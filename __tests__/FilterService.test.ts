import { FilterService } from '../src/services/filterService';
import { FilterOptions } from '../src/types';
import { ChargingStation } from '../src/types';

// Mock charging stations data
const mockStations: ChargingStation[] = [
  {
    ID: 1,
    UUID: "test-uuid-1",
    DataProviderID: 1,
    OperatorID: 1,
    UsageTypeID: 1,
    AddressInfo: {
      ID: 1,
      Title: "Test Station 1",
      AddressLine1: "Test Address 1",
      Town: "Test Town 1",
      StateOrProvince: "Test State 1",
      Postcode: "12345",
      CountryID: 1,
      Latitude: 41.0082,
      Longitude: 28.9784,
      Distance: 5
    },
    Connections: [
      {
        ID: 1,
        ConnectionTypeID: 1,
        StatusTypeID: 50,
        LevelID: 3,
        PowerKW: 50,
        CurrentTypeID: 30,
        Quantity: 2,
        ConnectionType: {
          ID: 1,
          Title: "Type 2",
        }
      }
    ],
    NumberOfPoints: 1,
    StatusTypeID: 50,
    StatusType: {
      IsOperational: true,
      IsUserSelectable: true,
      Title: "Operational"
    },
    GeneralComments: "Test comments",
    UserComments: [],
    MediaItems: [],
    IsRecentlyVerified: true,
    DateLastVerified: new Date().toISOString()
  },
  {
    ID: 2,
    UUID: "test-uuid-2",
    DataProviderID: 1,
    OperatorID: 2,
    UsageTypeID: 1,
    AddressInfo: {
      ID: 2,
      Title: "Test Station 2",
      AddressLine1: "Test Address 2",
      Town: "Test Town 2",
      StateOrProvince: "Test State 2",
      Postcode: "12346",
      CountryID: 1,
      Latitude: 41.0083,
      Longitude: 28.9785,
      Distance: 15
    },
    Connections: [
      {
        ID: 2,
        ConnectionTypeID: 2,
        StatusTypeID: 50,
        LevelID: 2,
        PowerKW: 22,
        CurrentTypeID: 10,
        Quantity: 1,
        ConnectionType: {
          ID: 2,
          Title: "Type 1",
        }
      }
    ],
    NumberOfPoints: 1,
    StatusTypeID: 50,
    StatusType: {
      IsOperational: true,
      IsUserSelectable: true,
      Title: "Operational"
    },
    GeneralComments: "Test comments 2",
    UserComments: [],
    MediaItems: [],
    IsRecentlyVerified: true,
    DateLastVerified: new Date().toISOString()
  }
];

describe('FilterService', () => {
  describe('applyFilters', () => {
    it('should return all stations when no filters are applied', () => {
      const filters: FilterOptions = FilterService.getDefaultFilters();
      const result = FilterService.applyFilters(mockStations, filters);
      expect(result).toHaveLength(2);
    });

    it('should filter by power range', () => {
      const filters: FilterOptions = {
        ...FilterService.getDefaultFilters(),
        minPowerKW: 30,
        maxPowerKW: 60
      };
      const result = FilterService.applyFilters(mockStations, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ID).toBe(1);
    });

    it('should filter by distance', () => {
      const filters: FilterOptions = {
        ...FilterService.getDefaultFilters(),
        maxDistance: 10
      };
      const result = FilterService.applyFilters(mockStations, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ID).toBe(1);
    });

    it('should filter by connection type', () => {
      const filters: FilterOptions = {
        ...FilterService.getDefaultFilters(),
        connectionTypes: ['Type 2']
      };
      const result = FilterService.applyFilters(mockStations, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ID).toBe(1);
    });

    it('should filter by fast charging', () => {
      const filters: FilterOptions = {
        ...FilterService.getDefaultFilters(),
        onlyFastCharging: true
      };
      const result = FilterService.applyFilters(mockStations, filters);
      expect(result).toHaveLength(1);
      expect(result[0].ID).toBe(1);
    });

    it('should filter by availability', () => {
      // Create a non-operational station
      const nonOperationalStation: ChargingStation = {
        ...mockStations[0],
        ID: 3,
        StatusType: {
          IsOperational: false,
          IsUserSelectable: true,
          Title: "Not Operational"
        }
      };
      
      const stationsWithNonOperational = [...mockStations, nonOperationalStation];
      const filters: FilterOptions = {
        ...FilterService.getDefaultFilters(),
        onlyAvailable: true
      };
      const result = FilterService.applyFilters(stationsWithNonOperational, filters);
      expect(result).toHaveLength(2);
      expect(result.some(s => s.ID === 3)).toBeFalsy();
    });
  });

  describe('searchStations', () => {
    it('should return all stations when search query is empty', () => {
      const result = FilterService.searchStations(mockStations, '');
      expect(result).toHaveLength(2);
    });

    it('should filter stations by title', () => {
      const result = FilterService.searchStations(mockStations, 'Test Station 1');
      expect(result).toHaveLength(1);
      expect(result[0].ID).toBe(1);
    });

    it('should filter stations by town', () => {
      const result = FilterService.searchStations(mockStations, 'Test Town 2');
      expect(result).toHaveLength(1);
      expect(result[0].ID).toBe(2);
    });
  });

  describe('getActiveFilterCount', () => {
    it('should return 0 when no filters are active', () => {
      const filters: FilterOptions = FilterService.getDefaultFilters();
      const count = FilterService.getActiveFilterCount(filters);
      expect(count).toBe(0);
    });

    it('should count active filters correctly', () => {
      const filters: FilterOptions = {
        ...FilterService.getDefaultFilters(),
        minPowerKW: 20,
        maxDistance: 50,
        onlyFastCharging: true,
        connectionTypes: ['Type 2']
      };
      const count = FilterService.getActiveFilterCount(filters);
      expect(count).toBe(4);
    });
  });

  describe('getFilterSummary', () => {
    it('should return empty string when no filters are active', () => {
      const filters: FilterOptions = FilterService.getDefaultFilters();
      const summary = FilterService.getFilterSummary(filters);
      expect(summary).toBe('');
    });

    it('should generate correct summary for active filters', () => {
      const filters: FilterOptions = {
        ...FilterService.getDefaultFilters(),
        minPowerKW: 20,
        maxPowerKW: 60,
        maxDistance: 50,
        onlyFastCharging: true,
        connectionTypes: ['Type 2']
      };
      const summary = FilterService.getFilterSummary(filters);
      expect(summary).toContain('20-60kW');
      expect(summary).toContain('50km yakın');
      expect(summary).toContain('Hızlı şarj');
      expect(summary).toContain('Type 2');
    });
  });
});