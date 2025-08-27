const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class EVDataService {
  constructor() {
    this.rawData = null;
    this.vehicles = [];
    this.brands = [];
    this.loadData();
  }

  /**
   * EV data JSON dosyasını yükle
   */
  loadData() {
    try {
      const dataPath = path.join(__dirname, '../data/ev-data.json');
      
      console.log('🔍 EVDataService loadData() called');
      console.log('📂 Data path:', dataPath);
      console.log('📂 __dirname:', __dirname);
      console.log('📁 Directory exists:', fs.existsSync(path.dirname(dataPath)));
      console.log('📄 File exists:', fs.existsSync(dataPath));
      
      if (fs.existsSync(dataPath)) {
        console.log('📖 Reading file...');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        console.log('📊 Raw data length:', rawData.length);
        
        console.log('🔄 Parsing JSON...');
        this.rawData = JSON.parse(rawData);
        console.log('✅ JSON parsed successfully');
        
        // Extract vehicles and brands from the complex structure
        this.brands = this.rawData.brands || [];
        this.vehicles = this.extractVehicles();
        
        console.log('🎯 Final results:', {
          vehicles: this.vehicles.length,
          brands: this.brands.length
        });
        
        logger.info(`EV Data loaded: ${this.vehicles.length} vehicles, ${this.brands.length} brands`);
      } else {
        console.log('❌ EV data file not found at:', dataPath);
        logger.warn('EV data file not found, using fallback data');
        this.vehicles = this.getFallbackData();
        this.brands = this.extractBrandsFromVehicles();
      }
    } catch (error) {
      console.error('💥 Error loading EV data:', error);
      logger.error('Error loading EV data:', error);
      this.vehicles = this.getFallbackData();
      this.brands = this.extractBrandsFromVehicles();
    }
  }

  /**
   * Complex JSON'dan vehicles array'ini çıkar
   */
  extractVehicles() {
    if (!this.rawData) {
      logger.warn('No raw data available');
      return [];
    }
    
    console.log('Raw data keys:', Object.keys(this.rawData));
    
    // JSON'da vehicles array'ini bul
    let vehicles = [];
    
    // JSON yapısı: { brands: [...], data: [...] }
    if (this.rawData.data && Array.isArray(this.rawData.data)) {
      vehicles = this.rawData.data;
      console.log('Found vehicles in data array, count:', vehicles.length);
    } else if (this.rawData.vehicles && Array.isArray(this.rawData.vehicles)) {
      vehicles = this.rawData.vehicles;
      console.log('Found vehicles in vehicles array, count:', vehicles.length);
    } else if (Array.isArray(this.rawData)) {
      vehicles = this.rawData;
      console.log('Raw data is array, count:', vehicles.length);
    } else {
      logger.warn('Could not find vehicles array in data structure');
      console.log('Raw data structure:', typeof this.rawData, Object.keys(this.rawData));
      return [];
    }
    
    // Normalize vehicle data
    const normalizedVehicles = vehicles.map(vehicle => this.normalizeVehicle(vehicle)).filter(Boolean);
    console.log('Normalized vehicles count:', normalizedVehicles.length);
    return normalizedVehicles;
  }

  /**
   * Recursive olarak vehicles array'ini bul
   */
  findVehiclesRecursive(obj) {
    let vehicles = [];
    
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        
        // Eğer bu bir vehicle object'i gibi görünüyorsa
        if (this.looksLikeVehicle(value)) {
          vehicles.push(value);
        }
        
        // Eğer bu bir array ise ve vehicle'lar içeriyorsa
        if (Array.isArray(value)) {
          const potentialVehicles = value.filter(item => this.looksLikeVehicle(item));
          if (potentialVehicles.length > 0) {
            vehicles = vehicles.concat(potentialVehicles);
          }
        }
        
        // Recursive search
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          vehicles = vehicles.concat(this.findVehiclesRecursive(value));
        }
      }
    }
    
    return vehicles;
  }

  /**
   * Object'in vehicle olup olmadığını kontrol et
   */
  looksLikeVehicle(obj) {
    if (!obj || typeof obj !== 'object') return false;
    
    // Vehicle object'i için gerekli field'lar
    const hasBasicFields = (obj.brand || obj.make) && (obj.model);
    const hasEVFields = obj.usable_battery_size || obj.battery_size || obj.energy_consumption || obj.ac_charger || obj.dc_charger;
    
    return hasBasicFields && hasEVFields;
  }

  /**
   * Vehicle object'ini normalize et
   */
  normalizeVehicle(vehicle) {
    if (!vehicle) return null;
    
    // Brand name'i bul
    const brandName = this.getBrandName(vehicle.brand_id) || vehicle.brand;
    
    // Connector types'ı çıkar
    const connectorTypes = [];
    if (vehicle.ac_charger && vehicle.ac_charger.ports) {
      connectorTypes.push(...vehicle.ac_charger.ports.map(port => this.normalizeConnectorType(port)));
    }
    if (vehicle.dc_charger && vehicle.dc_charger.ports) {
      connectorTypes.push(...vehicle.dc_charger.ports.map(port => this.normalizeConnectorType(port)));
    }
    
    // Max charging power'ı hesapla
    const maxChargingPower = Math.max(
      vehicle.ac_charger?.max_power || 0,
      vehicle.dc_charger?.max_power || 0
    );

    // Range hesapla (eğer yoksa battery ve consumption'dan hesapla)
    let range = vehicle.range || 0;
    if (!range && vehicle.usable_battery_size && vehicle.energy_consumption?.average_consumption) {
      // Range = Battery Size / Consumption * 100 (rough calculation)
      range = Math.round((vehicle.usable_battery_size / vehicle.energy_consumption.average_consumption) * 100);
    }
    
    return {
      id: vehicle.id || `${brandName}-${vehicle.model}-${vehicle.variant || ''}`.replace(/\s+/g, '-').toLowerCase(),
      brand: brandName,
      model: vehicle.model,
      variant: vehicle.variant || '',
      year: vehicle.release_year || new Date().getFullYear(),
      batteryCapacity: vehicle.usable_battery_size || vehicle.battery_size || 0,
      range: range,
      consumption: vehicle.energy_consumption?.average_consumption || 0,
      chargingPower: maxChargingPower,
      connectorTypes: [...new Set(connectorTypes)].filter(Boolean),
      acCharger: vehicle.ac_charger,
      dcCharger: vehicle.dc_charger,
      chargingVoltage: vehicle.charging_voltage,
      vehicleType: vehicle.vehicle_type || 'car'
    };
  }

  /**
   * Brand ID'den brand name'i al
   */
  getBrandName(brandId) {
    if (!brandId || !this.brands) return null;
    const brand = this.brands.find(b => b.id === brandId);
    return brand ? brand.name : null;
  }

  /**
   * Connector type'ını normalize et
   */
  normalizeConnectorType(port) {
    const typeMap = {
      'type2': 'Type 2',
      'ccs': 'CCS',
      'chademo': 'CHAdeMO',
      'tesla': 'Tesla',
      'type1': 'Type 1',
      'gbt': 'GB/T'
    };
    
    return typeMap[port.toLowerCase()] || port;
  }

  /**
   * Vehicles'lardan brand listesi çıkar
   */
  extractBrandsFromVehicles() {
    const brandNames = [...new Set(this.vehicles.map(v => v.brand))].filter(Boolean);
    return brandNames.map(name => ({ name, id: name.toLowerCase().replace(/\s+/g, '-') }));
  }

  /**
   * Tüm elektrikli araçları getir
   */
  getAllVehicles() {
    return this.vehicles || [];
  }

  /**
   * Marka listesini getir
   */
  getMakes() {
    if (!this.vehicles) return [];
    
    const makes = [...new Set(this.vehicles.map(vehicle => vehicle.brand))];
    return makes.filter(Boolean).sort();
  }

  /**
   * Belirli bir marka için modelleri getir
   */
  getModelsByMake(make) {
    if (!this.vehicles) return [];
    
    return this.vehicles
      .filter(vehicle => vehicle.brand === make)
      .map(vehicle => ({
        id: vehicle.id,
        model: vehicle.model,
        variant: vehicle.variant,
        year: vehicle.year,
        batteryCapacity: vehicle.batteryCapacity,
        range: vehicle.range,
        consumption: vehicle.consumption,
        chargingPower: vehicle.chargingPower,
        connectorTypes: vehicle.connectorTypes,
        acCharger: vehicle.acCharger,
        dcCharger: vehicle.dcCharger
      }))
      .sort((a, b) => {
        const modelCompare = a.model.localeCompare(b.model);
        if (modelCompare !== 0) return modelCompare;
        return (a.variant || '').localeCompare(b.variant || '');
      });
  }

  /**
   * ID ile araç detayını getir
   */
  getVehicleById(id) {
    if (!this.vehicles) return null;
    
    return this.vehicles.find(vehicle => vehicle.id === id);
  }

  /**
   * Araç arama
   */
  searchVehicles(query) {
    if (!this.vehicles || !query) return [];
    
    const searchTerm = query.toLowerCase();
    
    return this.vehicles.filter(vehicle => {
      const brand = (vehicle.brand || '').toLowerCase();
      const model = (vehicle.model || '').toLowerCase();
      const variant = (vehicle.variant || '').toLowerCase();
      
      return brand.includes(searchTerm) || 
             model.includes(searchTerm) || 
             variant.includes(searchTerm);
    });
  }

  /**
   * Filtreleme
   */
  filterVehicles(filters = {}) {
    if (!this.vehicles) return [];
    
    let filtered = [...this.vehicles];
    
    // Marka filtresi
    if (filters.make) {
      filtered = filtered.filter(vehicle => vehicle.brand === filters.make);
    }
    
    // Yıl filtresi
    if (filters.minYear) {
      filtered = filtered.filter(vehicle => (vehicle.year || 0) >= filters.minYear);
    }
    
    if (filters.maxYear) {
      filtered = filtered.filter(vehicle => (vehicle.year || 9999) <= filters.maxYear);
    }
    
    // Batarya kapasitesi filtresi
    if (filters.minBattery) {
      filtered = filtered.filter(vehicle => (vehicle.batteryCapacity || 0) >= filters.minBattery);
    }
    
    // Menzil filtresi
    if (filters.minRange) {
      filtered = filtered.filter(vehicle => (vehicle.range || 0) >= filters.minRange);
    }
    
    // Şarj gücü filtresi
    if (filters.minChargingPower) {
      filtered = filtered.filter(vehicle => (vehicle.chargingPower || 0) >= filters.minChargingPower);
    }
    
    // Konnektör tipi filtresi
    if (filters.connectorType) {
      filtered = filtered.filter(vehicle => {
        const connectors = vehicle.connectorTypes || [];
        return connectors.includes(filters.connectorType);
      });
    }
    
    // Tüketim filtresi
    if (filters.maxConsumption) {
      filtered = filtered.filter(vehicle => 
        !vehicle.consumption || vehicle.consumption <= filters.maxConsumption
      );
    }
    
    return filtered;
  }

  /**
   * İstatistikler
   */
  getStatistics() {
    if (!this.vehicles) return {};
    
    const makes = this.getMakes();
    const totalVehicles = this.vehicles.length;
    
    // Batarya kapasitesi istatistikleri
    const batteryCapacities = this.vehicles
      .map(v => v.batteryCapacity)
      .filter(cap => cap && cap > 0);
    
    const avgBatteryCapacity = batteryCapacities.length > 0 
      ? batteryCapacities.reduce((a, b) => a + b, 0) / batteryCapacities.length 
      : 0;
    
    // Menzil istatistikleri
    const ranges = this.vehicles
      .map(v => v.range)
      .filter(range => range && range > 0);
    
    const avgRange = ranges.length > 0 
      ? ranges.reduce((a, b) => a + b, 0) / ranges.length 
      : 0;
    
    // Tüketim istatistikleri
    const consumptions = this.vehicles
      .map(v => v.consumption)
      .filter(cons => cons && cons > 0);
    
    const avgConsumption = consumptions.length > 0
      ? consumptions.reduce((a, b) => a + b, 0) / consumptions.length
      : 0;
    
    // Şarj gücü istatistikleri
    const chargingPowers = this.vehicles
      .map(v => v.chargingPower)
      .filter(power => power && power > 0);
    
    const avgChargingPower = chargingPowers.length > 0
      ? chargingPowers.reduce((a, b) => a + b, 0) / chargingPowers.length
      : 0;
    
    // En popüler konnektör tipleri
    const allConnectors = this.vehicles
      .flatMap(v => v.connectorTypes || [])
      .filter(Boolean);
    
    const connectorCounts = allConnectors.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    const topConnectors = Object.entries(connectorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
    
    // Marka başına araç sayısı
    const brandCounts = makes.map(make => ({
      brand: make,
      count: this.vehicles.filter(v => v.brand === make).length
    })).sort((a, b) => b.count - a.count);
    
    return {
      totalVehicles,
      totalBrands: makes.length,
      avgBatteryCapacity: Math.round(avgBatteryCapacity * 10) / 10,
      avgRange: Math.round(avgRange),
      avgConsumption: Math.round(avgConsumption * 10) / 10,
      avgChargingPower: Math.round(avgChargingPower),
      topConnectors,
      topBrands: brandCounts.slice(0, 10),
      yearRange: {
        min: Math.min(...this.vehicles.map(v => v.year || 9999).filter(y => y < 9999)),
        max: Math.max(...this.vehicles.map(v => v.year || 0))
      }
    };
  }

  /**
   * Fallback data (ev-data.json yoksa)
   */
  getFallbackData() {
    return [
      {
        id: "tesla-model-3",
        brand: "Tesla",
        model: "Model 3",
        variant: "Long Range",
        year: 2023,
        batteryCapacity: 75,
        range: 500,
        consumption: 15,
        chargingPower: 250,
        connectorTypes: ["Type 2", "CCS"],
        acCharger: { max_power: 11, ports: ["type2"] },
        dcCharger: { max_power: 250, ports: ["ccs"] }
      },
      {
        id: "bmw-ix",
        brand: "BMW",
        model: "iX",
        variant: "xDrive40",
        year: 2023,
        batteryCapacity: 105,
        range: 600,
        consumption: 17.5,
        chargingPower: 200,
        connectorTypes: ["Type 2", "CCS"],
        acCharger: { max_power: 11, ports: ["type2"] },
        dcCharger: { max_power: 200, ports: ["ccs"] }
      },
      {
        id: "volkswagen-id4",
        brand: "Volkswagen",
        model: "ID.4",
        variant: "Pro",
        year: 2023,
        batteryCapacity: 77,
        range: 520,
        consumption: 14.8,
        chargingPower: 135,
        connectorTypes: ["Type 2", "CCS"],
        acCharger: { max_power: 11, ports: ["type2"] },
        dcCharger: { max_power: 135, ports: ["ccs"] }
      }
    ];
  }

  /**
   * Data'yı yeniden yükle
   */
  reloadData() {
    this.loadData();
  }
}

// Singleton instance
const evDataService = new EVDataService();

module.exports = evDataService;
