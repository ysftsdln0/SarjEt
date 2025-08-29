import { withAuth, getBaseUrl } from './apiClient';
import * as tokenStorage from './tokenStorage';

export interface UserVehicleVariant {
  id: string;
  name: string;
  year: number;
  maxRange?: number;
  model?: { name?: string; brand?: { name?: string } };
}

export interface VehicleBrand {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  name: string;
  brandId: string;
  brand?: VehicleBrand;
}

export interface VehicleVariant {
  id: string;
  name: string;
  year: number;
  modelId: string;
  maxRange?: number;
  batteryCapacity?: number;
  efficiency?: number;
  chargingSpeedAC?: number;
  chargingSpeedDC?: number;
  connectorTypes?: string[];
  model?: VehicleModel;
}

export interface CreateVehicleData {
  variantId: string;
  nickname?: string;
  licensePlate?: string;
  color?: string;
  currentBatteryLevel?: number;
}

export interface UserVehicle {
  id: string;
  nickname?: string;
  licensePlate?: string;
  color?: string;
  currentBatteryLevel?: number; // %
  variant?: UserVehicleVariant;
}

export interface PrimaryVehicle {
  id: string;
  nickname?: string;
  licensePlate?: string;
  color?: string;
  currentBatteryLevel: number; // %
  brand: string;
  model: string;
  variant: string;
  year: number;
  batteryCapacity: number; // kWh
  range: number; // km (maxRange from DB)
  cityRange?: number; // km
  highwayRange?: number; // km
  efficiency: number; // kWh/100km
  cityEfficiency?: number; // kWh/100km
  highwayEfficiency?: number; // kWh/100km
  chargingSpeed: {
    ac: number; // kW
    dc: number; // kW
  };
  connectorTypes: string[];
}

export const getUserVehicles = async (): Promise<UserVehicle[]> => {
  try {
    const currentToken = await tokenStorage.getToken();
    if (!currentToken) {
      return [];
    }
    
    const base = await getBaseUrl();
    const response = await fetch(`${base}/api/vehicles/user-vehicles`, {
      headers: withAuth(currentToken) as Record<string, string>,
    });
    
    if (!response.ok) {
      console.error('Failed to fetch user vehicles:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('📊 getUserVehicles API response:', data);
    
    // API'den gelen veriyi UserVehicle formatına dönüştür
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        id: item.id || item.ID || Math.random().toString(),
        nickname: item.nickname || item.Nickname,
        licensePlate: item.licensePlate || item.LicensePlate,
        color: item.color || item.Color,
        currentBatteryLevel: item.currentBatteryLevel || item.CurrentBatteryLevel || 100,
        variant: item.variant || item.Variant || {
          id: item.variantId || item.VariantId || 'unknown',
          name: item.variantName || item.VariantName || 'Tesla Model',
          year: item.year || item.Year || new Date().getFullYear(),
          maxRange: item.maxRange || item.MaxRange || 500,
          batteryCapacity: item.batteryCapacity || item.BatteryCapacity || 75,
          model: {
            id: item.modelId || item.ModelId || 'tesla-model',
            name: item.modelName || item.ModelName || 'Model',
            brand: {
              id: 'tesla',
              name: 'Tesla'
            }
          }
        }
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting user vehicles:', error);
    return [];
  }
};

export async function getPrimaryVehicle(token: string): Promise<PrimaryVehicle> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/user-vehicle/primary`, {
    headers: withAuth(token) as Record<string, string>,
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Ana araç bilgileri alınamadı');
  }
  
  return await res.json();
}

export async function setPrimaryVehicle(token: string, vehicleId: string): Promise<void> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/user-vehicle/primary`, {
    method: 'PUT',
    headers: {
      ...withAuth(token),
      'Content-Type': 'application/json',
    } as any,
    body: JSON.stringify({ vehicleId }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Birincil araç ayarlanamadı');
  }
}

export async function deleteVehicle(token: string, vehicleId: string): Promise<void> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/user-vehicle/${vehicleId}`, {
    method: 'DELETE',
    headers: withAuth(token) as any,
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Araç silinemedi');
  }
}

export async function getVehicleBrands(): Promise<VehicleBrand[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/brands`);
  
  if (!res.ok) {
    throw new Error('Araç markaları alınamadı');
  }
  
  return await res.json();
}

export async function getVehicleModels(brandId: string): Promise<VehicleModel[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/brands/${brandId}/models`);
  
  if (!res.ok) {
    throw new Error('Araç modelleri alınamadı');
  }
  
  return await res.json();
}

export async function getVehicleVariants(modelId: string, year?: number): Promise<VehicleVariant[]> {
  const base = await getBaseUrl();
  const url = year 
    ? `${base}/api/vehicles/models/${modelId}/variants?year=${year}`
    : `${base}/api/vehicles/models/${modelId}/variants`;
  
  console.log('🌐 Fetching variants from:', url);
  
  try {
    const res = await fetch(url);
    console.log('📊 Variants response status:', res.status, res.statusText);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Variants API error:', errorText);
      throw new Error(`Araç varyantları alınamadı: ${res.status} - ${errorText}`);
    }
    
    const data = await res.json();
    console.log('✅ Variants data received:', Array.isArray(data) ? data.length : 'not array', data);
    return data;
  } catch (fetchError) {
    console.error('❌ Variants fetch error:', fetchError);
    throw fetchError;
  }
}

export async function addUserVehicle(vehicleVariantId: string, nickname: string, token: string): Promise<Record<string, unknown>> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/user-vehicles`, {
    method: 'POST',
    headers: {
      ...withAuth(token),
      'Content-Type': 'application/json',
    } as any,
    body: JSON.stringify({ vehicleVariantId, nickname }),
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || 'Araç eklenemedi');
  }
  
  return await res.json();
}

export default { 
  getUserVehicles, 
  getPrimaryVehicle, 
  setPrimaryVehicle, 
  deleteVehicle,
  getVehicleBrands,
  getVehicleModels,
  getVehicleVariants,
  addUserVehicle
};
