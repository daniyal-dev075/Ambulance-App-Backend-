const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { updateLocation, updateAvailability } = require('../controllers/driverController');

router.use(verifyToken);

router.put('/:driverId/location', updateLocation);
router.put('/:driverId/availability', updateAvailability);

module.exports = router;
