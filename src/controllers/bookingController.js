const { db, messaging } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

// Helper to calculate distance
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

const createBooking = async (req, res) => {
  try {
    const { patientId, patientLatitude, patientLongitude } = req.body;

    if (!patientId || !patientLatitude || !patientLongitude) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find nearest available driver
    const driversRef = db.collection('drivers');
    const snapshot = await driversRef.where('isAvailable', '==', true).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'No available drivers found' });
    }

    let nearestDriver = null;
    let nearestDriverId = null;
    let minDistance = Infinity;

    snapshot.forEach(doc => {
      const driver = doc.data();
      if (driver.currentLatitude && driver.currentLongitude) {
        const distance = getDistanceFromLatLonInKm(
          patientLatitude, patientLongitude,
          driver.currentLatitude, driver.currentLongitude
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestDriver = driver;
          nearestDriverId = doc.id;
        }
      }
    });

    if (!nearestDriver) {
       return res.status(404).json({ error: 'No drivers with valid location found' });
    }

    // Find real hospital via Overpass API
    let hospitalData = {
      hospitalId: 'mock_h1',
      name: 'City General Hospital (Mock Fallback)',
      hospitalLatitude: patientLatitude + 0.01,
      hospitalLongitude: patientLongitude + 0.01
    };

    try {
      const overpassQuery = `[out:json];node["amenity"="hospital"](around:10000,${patientLatitude},${patientLongitude});out 10;`;
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
      const response = await axios.get(overpassUrl, {
        timeout: 8000,
        headers: {
          'User-Agent': 'LifeLineAmbulanceApp/1.0 (test@example.com)'
        }
      });
      
      if (response.data && response.data.elements && response.data.elements.length > 0) {
        // Sort hospitals by distance and pick the nearest one
        const sorted = response.data.elements
          .filter(h => h.lat && h.lon)
          .map(h => ({
            ...h,
            dist: getDistanceFromLatLonInKm(patientLatitude, patientLongitude, h.lat, h.lon)
          }))
          .sort((a, b) => a.dist - b.dist);

        const hNode = sorted[0];
        hospitalData = {
          hospitalId: hNode.id.toString(),
          name: hNode.tags?.name || 'Nearest Hospital',
          hospitalLatitude: hNode.lat,
          hospitalLongitude: hNode.lon
        };
        console.log(`Assigned hospital: ${hospitalData.name} (${hospitalData.dist?.toFixed(2)} km)`);
      }
    } catch (e) {
      console.error('Overpass API failed, using mock hospital:', e.message);
    }

    const bookingId = uuidv4();
    const bookingData = {
      bookingId,
      patientId,
      driverId: nearestDriver.driverId || nearestDriverId,
      hospitalId: hospitalData.hospitalId,
      hospitalName: hospitalData.name,
      patientLatitude,
      patientLongitude,
      hospitalLatitude: hospitalData.hospitalLatitude,
      hospitalLongitude: hospitalData.hospitalLongitude,
      driverLatitude: nearestDriver.currentLatitude,
      driverLongitude: nearestDriver.currentLongitude,
      requestTime: new Date().toISOString(),
      pickupTime: null,
      arrivalTime: null,
      status: 'pending',
      estimatedArrivalTime: null
    };

    await db.collection('bookings').doc(bookingId).set(bookingData);

    // Send FCM to driver if they have a token (assuming token is stored in driver doc)
    if (nearestDriver.fcmToken) {
       await messaging.send({
         token: nearestDriver.fcmToken,
         notification: {
           title: 'New Emergency Booking',
           body: 'You have a new ambulance request nearby.'
         },
         data: { bookingId }
       });
    }

    res.status(201).json({ message: 'Booking created', booking: bookingData });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

const updateBookingStatus = async (req, res, newStatus, notificationMessage) => {
   try {
    const { bookingId } = req.params;
    const bookingRef = db.collection('bookings').doc(bookingId);
    const doc = await bookingRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const updates = { status: newStatus };
    if (newStatus === 'completed' || newStatus === 'cancelled') {
        const data = doc.data();
        if (data.driverId) {
             await db.collection('drivers').doc(data.driverId).update({ isAvailable: true });
        }
    }

    await bookingRef.update(updates);

    // Send notification to patient
    const data = doc.data();
    const patientDoc = await db.collection('users').doc(data.patientId).get();
    if (patientDoc.exists) {
        const patientData = patientDoc.data();
        if (patientData.fcmToken) {
             await messaging.send({
                 token: patientData.fcmToken,
                 notification: {
                     title: 'Booking Update',
                     body: notificationMessage
                 },
                 data: { bookingId }
             });
        }
    }

    res.status(200).json({ message: `Booking status updated to ${newStatus}` });
  } catch (error) {
    console.error(`Error updating booking status to ${newStatus}:`, error);
    res.status(500).json({ error: 'Failed to update booking status' });
  }
}

const acceptBooking = (req, res) => updateBookingStatus(req, res, 'accepted', 'Your ambulance is on the way.');
const startBooking = (req, res) => updateBookingStatus(req, res, 'in_progress', 'Your trip has started.');
const completeBooking = (req, res) => updateBookingStatus(req, res, 'completed', 'Your trip is completed.');
const cancelBooking = (req, res) => updateBookingStatus(req, res, 'cancelled', 'Your booking was cancelled.');

const getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const doc = await db.collection('bookings').doc(bookingId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(doc.data());
  } catch (error) {
    res.status(500).json({ error: 'Error fetching booking' });
  }
};

const getPatientBookings = async (req, res) => {
  try {
    const { patientId } = req.params;
    const snapshot = await db.collection('bookings').where('patientId', '==', patientId).get();
    const bookings = snapshot.docs.map(doc => doc.data());
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bookings' });
  }
};

const getDriverBookings = async (req, res) => {
  try {
    const { driverId } = req.params;
    const snapshot = await db.collection('bookings').where('driverId', '==', driverId).get();
    const bookings = snapshot.docs.map(doc => doc.data());
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bookings' });
  }
};

module.exports = {
  createBooking,
  acceptBooking,
  startBooking,
  completeBooking,
  cancelBooking,
  getBooking,
  getPatientBookings,
  getDriverBookings
};
