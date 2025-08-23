import { withAuth, getBaseUrl } from './apiClient';

export interface UserVehicleVariant {
  id: string;
  name: string;
  year: number;
  maxRange?: number; // backend VehicleVariant.maxRange (km)
  model?: { name?: string; brand?: { name?: string } };
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

export default { getUserVehicles, getPrimaryVehicle };
