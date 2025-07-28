/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians 
 * @returns {number} Degrees
 */
function toDegrees(radians) {
  return radians * (180 / Math.PI);
}

/**
 * Calculate bearing between two points
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Bearing in degrees
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = toRadians(lon2 - lon1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360 degrees
}

/**
 * Find the closest point to a given location
 * @param {Object} targetLocation - { latitude, longitude }
 * @param {Array} points - Array of { latitude, longitude } objects
 * @returns {Object} Closest point with distance
 */
function findClosestPoint(targetLocation, points) {
  if (!points || points.length === 0) {
    return null;
  }
  
  let closestPoint = null;
  let minDistance = Infinity;
  
  points.forEach(point => {
    const distance = calculateDistance(
      targetLocation.latitude,
      targetLocation.longitude,
      point.latitude,
      point.longitude
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = { ...point, distance };
    }
  });
  
  return closestPoint;
}

/**
 * Check if a point is within a bounding box
 * @param {Object} point - { latitude, longitude }
 * @param {Object} bounds - { north, south, east, west }
 * @returns {boolean}
 */
function isPointInBounds(point, bounds) {
  return (
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  );
}

/**
 * Create a bounding box around a center point with given radius
 * @param {number} latitude - Center latitude
 * @param {number} longitude - Center longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box { north, south, east, west }
 */
function createBoundingBox(latitude, longitude, radiusKm) {
  const latDelta = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const lonDelta = radiusKm / (111.32 * Math.cos(toRadians(latitude)));
  
  return {
    north: latitude + latDelta,
    south: latitude - latDelta,
    east: longitude + lonDelta,
    west: longitude - lonDelta
  };
}

/**
 * Filter points within a radius from center point
 * @param {Object} center - { latitude, longitude }
 * @param {Array} points - Array of points with latitude, longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Array} Filtered points with distances
 */
function filterPointsInRadius(center, points, radiusKm) {
  return points
    .map(point => ({
      ...point,
      distance: calculateDistance(
        center.latitude,
        center.longitude,
        point.latitude,
        point.longitude
      )
    }))
    .filter(point => point.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Validate latitude value
 * @param {number} lat 
 * @returns {boolean}
 */
function isValidLatitude(lat) {
  return typeof lat === 'number' && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude value
 * @param {number} lon 
 * @returns {boolean}
 */
function isValidLongitude(lon) {
  return typeof lon === 'number' && lon >= -180 && lon <= 180;
}

/**
 * Validate geographic coordinates
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {boolean}
 */
function isValidCoordinates(latitude, longitude) {
  return isValidLatitude(latitude) && isValidLongitude(longitude);
}

module.exports = {
  calculateDistance,
  calculateBearing,
  findClosestPoint,
  isPointInBounds,
  createBoundingBox,
  filterPointsInRadius,
  isValidLatitude,
  isValidLongitude,
  isValidCoordinates,
  toRadians,
  toDegrees
};
