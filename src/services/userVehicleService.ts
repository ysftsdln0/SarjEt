import { withAuth, get, getBaseUrl } from './apiClient';

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

export default { getUserVehicles };
