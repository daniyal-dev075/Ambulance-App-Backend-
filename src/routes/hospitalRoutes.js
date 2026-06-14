const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getAllHospitals, recommendHospital } = require('../controllers/hospitalController');

router.use(verifyToken);

router.get('/', getAllHospitals);
router.get('/recommend', recommendHospital);

module.exports = router;
