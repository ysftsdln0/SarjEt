import { withAuth, getBaseUrl } from './apiClient';

export interface UserVehicleVariant {
  id: string;
  name: string;
  year: number;
  maxRange?: number; // backend VehicleVariant.maxRange (km)
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

export async function getUserVehicles(token: string): Promise<UserVehicle[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/user-vehicles`, {
    headers: withAuth(token) as any,
  });
  if (!res.ok) throw new Error('Kullanıcı araçları alınamadı');
  const data = await res.json();
  // routes/vehicles.js returns array directly, not wrapped
  return Array.isArray(data) ? (data as UserVehicle[]) : (data as any).vehicles || [];
}

export async function getPrimaryVehicle(token: string): Promise<PrimaryVehicle> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/user-vehicle/primary`, {
    headers: withAuth(token) as any,
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
  
  const res = await fetch(url);
  
  if (!res.ok) {
    throw new Error('Araç varyantları alınamadı');
  }
  
  return await res.json();
}

export async function createUserVehicle(token: string, vehicleData: CreateVehicleData): Promise<UserVehicle> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/vehicles/user-vehicles`, {
    method: 'POST',
    headers: {
      ...withAuth(token),
      'Content-Type': 'application/json',
    } as any,
    body: JSON.stringify(vehicleData),
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
  createUserVehicle
};
