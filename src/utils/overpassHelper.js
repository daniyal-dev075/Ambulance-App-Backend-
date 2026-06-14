const axios = require('axios');

// Multiple Overpass API mirrors - tried in order until one works
const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Queries multiple Overpass mirrors for hospitals near a location.
 * Returns an array of elements sorted by distance, or null if all fail.
 */
async function queryNearestHospitals(lat, lng, limit = 10) {
  const overpassQuery = `[out:json];node["amenity"="hospital"](around:15000,${lat},${lng});out ${limit};`;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      console.log(`Trying Overpass mirror: ${mirror}`);
      const response = await axios.get(mirror, {
        params: { data: overpassQuery },
        timeout: 8000,
        headers: {
          'User-Agent': 'LifeLineAmbulanceApp/1.0 (contact@ambulanceapp.com)',
          'Accept': 'application/json',
        },
      });

      if (response.data && response.data.elements && response.data.elements.length > 0) {
        const hospitals = response.data.elements
          .filter(h => h.lat && h.lon)
          .map(h => ({
            hospitalId: h.id.toString(),
            name: h.tags?.name || 'Unnamed Hospital',
            latitude: h.lat,
            longitude: h.lon,
            distance: getDistanceFromLatLonInKm(lat, lng, h.lat, h.lon),
          }))
          .sort((a, b) => a.distance - b.distance);

        console.log(`Success: Found ${hospitals.length} hospitals via ${mirror}`);
        return hospitals;
      }
    } catch (err) {
      console.warn(`Mirror ${mirror} failed: ${err.message}`);
    }
  }

  console.error('All Overpass mirrors failed.');
  return null;
}

module.exports = { getDistanceFromLatLonInKm, deg2rad, queryNearestHospitals };
