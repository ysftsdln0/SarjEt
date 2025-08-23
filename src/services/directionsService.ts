import MapboxGL from '@rnmapbox/maps';

export interface DirectionsResponse {
  routes: Array<{
    geometry: {
      coordinates: [number, number][];
      type: 'LineString';
    };
    distance: number;
    duration: number;
  }>;
}

export async function getDirectionsRoute(
  waypoints: Array<{ latitude: number; longitude: number }>,
  profile: 'driving' | 'walking' | 'cycling' = 'driving'
): Promise<DirectionsResponse | null> {
  try {
    const accessToken = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mapbox access token not found');
      return null;
    }

    // Waypoint'leri longitude,latitude formatına çevir
    const coordinates = waypoints
      .map(wp => `${wp.longitude},${wp.latitude}`)
      .join(';');

    // Daha detaylı ve yola uygun rota için ek parametreler
    const params = new URLSearchParams({
      geometries: 'geojson',
      steps: 'true', // Daha detaylı adım bilgisi
      overview: 'full', // Tam geometri
      annotations: 'distance,duration', // Mesafe ve süre bilgileri
      continue_straight: 'true', // Düz devam etmeyi tercih et
      access_token: accessToken
    });

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}?${params}`;
    
    console.log('Fetching detailed directions from:', url);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Mapbox Directions API error:', data);
      return null;
    }

    console.log('Received route with', data.routes[0]?.geometry?.coordinates?.length || 0, 'coordinate points');

    return data;
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null;
  }
}

export async function getRouteWithStops(
  startPoint: { latitude: number; longitude: number },
  endPoint: { latitude: number; longitude: number },
  chargingStops: Array<{ latitude: number; longitude: number; title?: string }>
): Promise<{
  coordinates: [number, number][];
  distance: number;
  duration: number;
} | null> {
  try {
    // Tüm noktaları sırayla birleştir: başlangıç + şarj durakları + hedef
    const allWaypoints = [
      startPoint,
      ...chargingStops,
      endPoint
    ];

    console.log('Getting route with waypoints:', allWaypoints.length);
    console.log('All waypoints:', allWaypoints.map(wp => `${wp.latitude}, ${wp.longitude}`));

    // Eğer çok fazla waypoint varsa, segmentler halinde rota al ve birleştir
    if (allWaypoints.length > 25) { // Mapbox limiti ~25 waypoint
      return await getRouteInSegments(allWaypoints);
    }

    const directionsResult = await getDirectionsRoute(allWaypoints, 'driving');
    
    if (!directionsResult || !directionsResult.routes.length) {
      console.warn('No route found, falling back to direct segments');
      return await getRouteInSegments(allWaypoints);
    }

    const route = directionsResult.routes[0];
    console.log('Successfully got route with', route.geometry.coordinates.length, 'points');
    
    return {
      coordinates: route.geometry.coordinates,
      distance: route.distance,
      duration: route.duration
    };
  } catch (error) {
    console.error('Error getting route with stops:', error);
    // Fallback: düz çizgiler kullan
    return null;
  }
}

// Uzun rotalar için segment segment rota alma
async function getRouteInSegments(
  waypoints: Array<{ latitude: number; longitude: number }>
): Promise<{
  coordinates: [number, number][];
  distance: number;
  duration: number;
} | null> {
  try {
    const segments: [number, number][][] = [];
    let totalDistance = 0;
    let totalDuration = 0;

    // 20'şer waypoint'lik segmentler oluştur
    const segmentSize = 20;
    for (let i = 0; i < waypoints.length - 1; i += segmentSize - 1) {
      const segmentEnd = Math.min(i + segmentSize, waypoints.length);
      const segmentWaypoints = waypoints.slice(i, segmentEnd);
      
      console.log(`Getting segment ${Math.floor(i / (segmentSize - 1)) + 1}: points ${i} to ${segmentEnd - 1}`);
      
      const segmentRoute = await getDirectionsRoute(segmentWaypoints, 'driving');
      
      if (segmentRoute && segmentRoute.routes.length > 0) {
        const route = segmentRoute.routes[0];
        segments.push(route.geometry.coordinates);
        totalDistance += route.distance;
        totalDuration += route.duration;
      } else {
        console.warn(`Failed to get segment route for points ${i}-${segmentEnd - 1}`);
      }
    }

    if (segments.length === 0) {
      return null;
    }

    // Segmentleri birleştir
    const allCoordinates: [number, number][] = [];
    segments.forEach((segment, index) => {
      if (index === 0) {
        allCoordinates.push(...segment);
      } else {
        // İlk koordinatı atla (overlap'i önlemek için)
        allCoordinates.push(...segment.slice(1));
      }
    });

    console.log('Combined segments into route with', allCoordinates.length, 'points');

    return {
      coordinates: allCoordinates,
      distance: totalDistance,
      duration: totalDuration
    };
  } catch (error) {
    console.error('Error getting segmented route:', error);
    return null;
  }
}
