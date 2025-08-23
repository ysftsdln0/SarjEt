import { post } from './apiClient';

export interface PlanRouteRequest {
  start: { latitude: number; longitude: number };
  end: { latitude: number; longitude: number };
  vehicle?: { maxRangeKm?: number; maxRange?: number };
  currentSocPercent?: number;
  reservePercent?: number;
  corridorKm?: number;
  maxStops?: number;
  chargeAfterStopPercent?: number;
}

export interface PlannedRoutePoint {
  latitude: number;
  longitude: number;
  type?: 'start' | 'charging' | 'destination';
  title?: string;
  stationId?: number;
  powerKW?: number;
}

export interface PlanRouteResponse {
  success: boolean;
  data?: {
    points: PlannedRoutePoint[];
    summary: {
      distanceKm: number;
      durationMin: number;
      chargingStops: number;
      reservePercent: number;
    };
  };
  error?: string;
}

export async function planRoute(req: PlanRouteRequest): Promise<PlanRouteResponse> {
  const res = await post('/api/routes/plan', req);
  const json = await res.json();
  return json as PlanRouteResponse;
}

export default { planRoute };
