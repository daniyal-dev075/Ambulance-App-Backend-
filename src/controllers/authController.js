const { db } = require('../config/firebase');

const registerPatient = async (req, res) => {
  try {
    const { userId, name, phone, email, latitude, longitude } = req.body;

    if (!userId || !name || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const patientData = {
      userId,
      name,
      phone,
      email: email || '',
      latitude: latitude || null,
      longitude: longitude || null,
      createdAt: new Date().toISOString()
    };

    await db.collection('users').doc(userId).set(patientData);

    res.status(201).json({ message: 'Patient registered successfully', patient: patientData });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ error: 'Failed to register patient' });
  }
};

const registerDriver = async (req, res) => {
  try {
    const { driverId, name, phone, vehicleNumber, licenseNumber, ambulanceType } = req.body;

    if (!driverId || !name || !phone || !vehicleNumber || !licenseNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const driverData = {
      driverId,
      name,
      phone,
      vehicleNumber,
      licenseNumber,
      ambulanceType: ambulanceType || 'Standard',
      isAvailable: false,
      currentLatitude: null,
      currentLongitude: null,
      createdAt: new Date().toISOString()
    };

    await db.collection('drivers').doc(driverId).set(driverData);

    // Also create ambulance record implicitly or separate it later. Following prompt exactly:
    await db.collection('ambulances').doc(driverId).set({
      ambulanceId: driverId,
      vehicleNumber,
      type: ambulanceType || 'Standard',
      driverId,
      isAvailable: false
    });

    res.status(201).json({ message: 'Driver registered successfully', driver: driverData });
  } catch (error) {
    console.error('Error registering driver:', error);
    res.status(500).json({ error: 'Failed to register driver' });
  }
};

module.exports = { registerPatient, registerDriver };
