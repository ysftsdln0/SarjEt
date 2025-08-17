const chargingStationService = require('./chargingStationService');

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distancePointToSegmentKm(p, v, w) {
  const l2 = Math.pow(haversine(v.lat, v.lon, w.lat, w.lon), 2);
  if (l2 === 0) return haversine(p.lat, p.lon, v.lat, v.lon);
  const pv = { x: p.lat - v.lat, y: p.lon - v.lon };
  const vw = { x: w.lat - v.lat, y: w.lon - v.lon };
  const vw2 = vw.x * vw.x + vw.y * vw.y;
  const t = Math.max(0, Math.min(1, (pv.x * vw.x + pv.y * vw.y) / vw2));
  const proj = { lat: v.lat + t * vw.x, lon: v.lon + t * vw.y };
  return haversine(p.lat, p.lon, proj.lat, proj.lon);
}

function pointAlongLineKm(current, destination, targetKm) {
  const totalKm = haversine(current.lat, current.lon, destination.lat, destination.lon);
  if (totalKm <= 0) return { lat: current.lat, lon: current.lon };
  const frac = Math.max(0, Math.min(1, targetKm / totalKm));
  return {
    lat: current.lat + (destination.lat - current.lat) * frac,
    lon: current.lon + (destination.lon - current.lon) * frac
  };
}

function planRoute({ start, end, vehicle, currentSocPercent = 100, reservePercent = 10, corridorKm = 30, maxStops = 8, chargeAfterStopPercent = 90 }) {
  const maxRangeKm = vehicle?.maxRangeKm || vehicle?.maxRange || 300;
  const reserveKm = (maxRangeKm * reservePercent) / 100;
  let current = { lat: start.latitude, lon: start.longitude };
  const destination = { lat: end.latitude, lon: end.longitude };
  let soc = Math.max(0, Math.min(100, currentSocPercent));
  const waypoints = [];
  let hops = 0;

  while (true) {
    const availableKm = (maxRangeKm * soc) / 100;
    const distToDest = haversine(current.lat, current.lon, destination.lat, destination.lon);
    if (distToDest <= Math.max(0, availableKm - reserveKm)) {
      break;
    }
    if (hops >= maxStops) {
      // Fallback: instead of failing immediately, try widening the corridor progressively
      let widenedCorridor = corridorKm;
      let retryChosen = null;
      while (widenedCorridor <= Math.max(20, corridorKm + 10) && !retryChosen) {
        const sr = Math.min(Math.max(availableKm - reserveKm, 0), 200);
        const targetAlongKm = Math.max(0, Math.min(distToDest, availableKm * 0.9));
        const targetPoint = pointAlongLineKm(current, destination, targetAlongKm);
        const retryCandidates = chargingStationService.findNearbyStations(current.lat, current.lon, sr, 500)
          .map(st => ({
            station: st,
            dist: haversine(current.lat, current.lon, st.AddressInfo.Latitude, st.AddressInfo.Longitude),
            toDestAfter: haversine(st.AddressInfo.Latitude, st.AddressInfo.Longitude, destination.lat, destination.lon),
            power: Math.max(...(st.Connections || []).map(c => c.PowerKW || 0), 0),
            isOperational: st.StatusTypeID === 50 || st.StatusTypeID === 75,
            distToTarget: haversine(st.AddressInfo.Latitude, st.AddressInfo.Longitude, targetPoint.lat, targetPoint.lon),
            corridorDist: distancePointToSegmentKm({ lat: st.AddressInfo.Latitude, lon: st.AddressInfo.Longitude }, current, destination)
          }))
          .filter(c => c.dist <= Math.max(0, availableKm - reserveKm) && c.corridorDist <= widenedCorridor);
        if (retryCandidates.length > 0) {
          retryCandidates.sort((a, b) => {
            if (a.distToTarget !== b.distToTarget) return a.distToTarget - b.distToTarget;
            if (a.corridorDist !== b.corridorDist) return a.corridorDist - b.corridorDist;
            if (a.isOperational !== b.isOperational) return a.isOperational ? -1 : 1;
            if (a.power !== b.power) return b.power - a.power;
            if (a.toDestAfter !== b.toDestAfter) return a.toDestAfter - b.toDestAfter;
            return b.dist - a.dist;
          });
          retryChosen = retryCandidates[0];
          break;
        }
        widenedCorridor += 3; // widen step
      }
      if (!retryChosen) {
        throw new Error('Rota planlanamadı: Çok fazla durak gerektiriyor');
      }
      // apply retryChosen as chosen stop
      const chosen = retryChosen;
      waypoints.push({
        type: 'charging',
        latitude: chosen.station.AddressInfo.Latitude,
        longitude: chosen.station.AddressInfo.Longitude,
        stationId: chosen.station.ID,
        title: chosen.station.AddressInfo.Title,
        powerKW: chosen.power
      });
      const usedPercentRetry = (chosen.dist / maxRangeKm) * 100;
      soc = Math.max(0, soc - usedPercentRetry);
      soc = Math.max(soc, reservePercent);
      soc = Math.max(soc, chargeAfterStopPercent);
      current = { lat: chosen.station.AddressInfo.Latitude, lon: chosen.station.AddressInfo.Longitude };
      hops += 1;
      continue;
    }

  const searchRadiusKm = Math.min(Math.max(availableKm - reserveKm, 0), 200);
  // Flowchart: 0.9 × kullanılabilir menzil noktasını bul
  const targetAlongKm = Math.max(0, Math.min(distToDest, availableKm * 0.9));
  const targetPoint = pointAlongLineKm(current, destination, targetAlongKm);
    const candidates = chargingStationService.findNearbyStations(current.lat, current.lon, searchRadiusKm, 500)
      .filter(st => {
        const pt = { lat: st.AddressInfo.Latitude, lon: st.AddressInfo.Longitude };
        const corridorDist = distancePointToSegmentKm(pt, current, destination);
        return corridorDist <= corridorKm;
      })
      .map(st => ({
        station: st,
        dist: haversine(current.lat, current.lon, st.AddressInfo.Latitude, st.AddressInfo.Longitude),
        toDestAfter: haversine(st.AddressInfo.Latitude, st.AddressInfo.Longitude, destination.lat, destination.lon),
        power: Math.max(...(st.Connections || []).map(c => c.PowerKW || 0), 0),
    isOperational: st.StatusTypeID === 50 || st.StatusTypeID === 75,
    distToTarget: haversine(st.AddressInfo.Latitude, st.AddressInfo.Longitude, targetPoint.lat, targetPoint.lon),
    corridorDist: distancePointToSegmentKm({ lat: st.AddressInfo.Latitude, lon: st.AddressInfo.Longitude }, current, destination)
      }))
      .filter(c => c.dist <= Math.max(0, availableKm - reserveKm));

    if (candidates.length === 0) {
      throw new Error('Rota planlanamadı: Ulaşılabilir şarj istasyonu bulunamadı');
    }

    candidates.sort((a, b) => {
      if (a.distToTarget !== b.distToTarget) return a.distToTarget - b.distToTarget; // hedef noktaya yakınlık
      if (a.corridorDist !== b.corridorDist) return a.corridorDist - b.corridorDist; // rota dışı sapma
      if (a.isOperational !== b.isOperational) return a.isOperational ? -1 : 1; // çalışır durumda öncelik
      if (a.power !== b.power) return b.power - a.power; // hızlı şarj öncelikli
      if (a.toDestAfter !== b.toDestAfter) return a.toDestAfter - b.toDestAfter; // hedefe yaklaşma
      return b.dist - a.dist; // son çare: erişim menzili içinde en uzak (ilerleme maksimize)
    });

    const chosen = candidates[0];
    waypoints.push({
      type: 'charging',
      latitude: chosen.station.AddressInfo.Latitude,
      longitude: chosen.station.AddressInfo.Longitude,
      stationId: chosen.station.ID,
      title: chosen.station.AddressInfo.Title,
      powerKW: chosen.power
    });

    const usedPercent = (chosen.dist / maxRangeKm) * 100;
    soc = Math.max(0, soc - usedPercent);
    soc = Math.max(soc, reservePercent);
    soc = Math.max(soc, chargeAfterStopPercent);
    current = { lat: chosen.station.AddressInfo.Latitude, lon: chosen.station.AddressInfo.Longitude };
    hops += 1;
  }

  const points = [
    { latitude: start.latitude, longitude: start.longitude, type: 'start' },
    ...waypoints,
    { latitude: end.latitude, longitude: end.longitude, type: 'destination' }
  ];

  let distKm = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    distKm += haversine(a.latitude, a.longitude, b.latitude, b.longitude);
  }
  const avgSpeedKmh = 70;
  const durationMin = Math.round((distKm / avgSpeedKmh) * 60);

  return {
    success: true,
    data: {
      points,
      summary: {
        distanceKm: Math.round(distKm * 10) / 10,
        durationMin,
        chargingStops: waypoints.length,
        reservePercent
      }
    }
  };
}

module.exports = { planRoute };
