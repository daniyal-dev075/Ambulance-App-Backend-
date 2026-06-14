const express = require('express');
const router = express.Router();
const { registerPatient, registerDriver } = require('../controllers/authController');

// Note: Registration routes are unprotected as per prompt. Token verification happens on client-side before calling this to link the Firebase UID to the record.
router.post('/register-patient', registerPatient);
router.post('/register-driver', registerDriver);

module.exports = router;
