const { db } = require('../config/firebase');
const { queryNearestHospitals } = require('../utils/overpassHelper');

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

  const hospitals = await queryNearestHospitals(patientLat, patientLng, 10);

  if (!hospitals || hospitals.length === 0) {
    // Return empty array gracefully instead of 500
    return res.status(200).json([]);
  }

  // Format for frontend: distance rounded to 1 decimal
  const formatted = hospitals.slice(0, 3).map(h => ({
    hospitalId: h.hospitalId,
    name: h.name,
    latitude: h.latitude,
    longitude: h.longitude,
    distance: h.distance.toFixed(1),
  }));

  return res.status(200).json(formatted);
};

module.exports = { getAllHospitals, recommendHospital };
