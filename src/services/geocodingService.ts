export interface GeocodeResult {
  displayName: string;
  latitude: number;
  longitude: number;
  address?: Record<string, any>;
}

// Simple Nominatim (OpenStreetMap) search without API key
export async function searchPlaces(query: string, countryCode: string = 'tr', limit = 5): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&accept-language=tr&countrycodes=${encodeURIComponent(countryCode)}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      // Nominatim etiketi için basit bir UA
      'User-Agent': 'SarjEtApp/1.0 (https://example.com)'
    }
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data || []).map((item: any) => ({
    displayName: item.display_name,
    latitude: parseFloat(item.lat),
    longitude: parseFloat(item.lon),
    address: item.address,
  }));
}

export default { searchPlaces };
