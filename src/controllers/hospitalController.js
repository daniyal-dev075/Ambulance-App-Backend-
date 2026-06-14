const { db } = require('../config/firebase');
const axios = require('axios');

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

const getAllHospitals = async (req, res) => {
  try {
    const snapshot = await db.collection('hospitals').get();
    const hospitals = snapshot.docs.map(doc => doc.data());
    res.status(200).json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
};

const recommendHospital = async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Missing latitude or longitude' });
  }

  const patientLat = parseFloat(lat);
  const patientLng = parseFloat(lng);

  try {
    const overpassQuery = `[out:json];node["amenity"="hospital"](around:10000,${patientLat},${patientLng});out 10;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    
    const response = await axios.get(overpassUrl, {
      timeout: 3000,
      headers: {
        'User-Agent': 'LifeLineAmbulanceApp/1.0 (test@example.com)'
      }
    });

    if (response.data && response.data.elements && response.data.elements.length > 0) {
      let hospitals = response.data.elements.map(hNode => {
        const hLat = hNode.lat;
        const hLng = hNode.lon;
        const distance = getDistanceFromLatLonInKm(patientLat, patientLng, hLat, hLng);
        return {
          hospitalId: hNode.id.toString(),
          name: hNode.tags?.name || 'Local Hospital',
          latitude: hLat,
          longitude: hLng,
          distance: distance.toFixed(1) // Keep one decimal place
        };
      });

      // Sort by distance ascending
      hospitals.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      
      // Return top 3
      return res.status(200).json(hospitals.slice(0, 3));
    }

    return res.status(200).json([]);
  } catch (error) {
    console.error('Error fetching nearest hospitals from Overpass:', error.message);
    res.status(500).json({ error: 'Failed to fetch hospitals' });
  }
};

module.exports = { getAllHospitals, recommendHospital };
