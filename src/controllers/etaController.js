const axios = require('axios');

const getEta = async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    if (!originLat || !originLng || !destLat || !destLng) {
      return res.status(400).json({ error: 'Missing origin or destination coordinates' });
    }

    // OSRM expects coordinates in lng,lat order
    const url = `http://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const durationSeconds = route.duration;
      const distanceMeters = route.distance;
      
      const estimatedMinutes = Math.ceil(durationSeconds / 60);
      const estimatedKilometers = (distanceMeters / 1000).toFixed(2);

      return res.status(200).json({
        estimatedMinutes,
        estimatedKilometers
      });
    } else {
      return res.status(404).json({ error: 'Route not found' });
    }
  } catch (error) {
    console.error('Error fetching ETA from OSRM:', error.message);
    res.status(500).json({ error: 'Failed to calculate ETA' });
  }
};

module.exports = { getEta };
