const { db } = require('../config/firebase');

const updateLocation = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { currentLatitude, currentLongitude } = req.body;

    if (currentLatitude === undefined || currentLongitude === undefined) {
      return res.status(400).json({ error: 'Missing coordinates' });
    }

    await db.collection('drivers').doc(driverId).set({
      currentLatitude,
      currentLongitude
    }, { merge: true });

    res.status(200).json({ message: 'Location updated' });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
};

const updateAvailability = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { isAvailable } = req.body;

    if (isAvailable === undefined) {
      return res.status(400).json({ error: 'Missing isAvailable status' });
    }

    await db.collection('drivers').doc(driverId).set({
      isAvailable
    }, { merge: true });

    res.status(200).json({ message: 'Availability updated' });
  } catch (error) {
    console.error('Error updating driver availability:', error);
    res.status(500).json({ error: 'Failed to update availability' });
  }
};

module.exports = { updateLocation, updateAvailability };
