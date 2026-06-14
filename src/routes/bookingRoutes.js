const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const {
  createBooking,
  acceptBooking,
  startBooking,
  completeBooking,
  cancelBooking,
  getBooking,
  getPatientBookings,
  getDriverBookings
} = require('../controllers/bookingController');

router.use(verifyToken);

router.post('/create', createBooking);
router.put('/:bookingId/accept', acceptBooking);
router.put('/:bookingId/start', startBooking);
router.put('/:bookingId/complete', completeBooking);
router.put('/:bookingId/cancel', cancelBooking);
router.get('/:bookingId', getBooking);
router.get('/patient/:patientId', getPatientBookings);
router.get('/driver/:driverId', getDriverBookings);

module.exports = router;
