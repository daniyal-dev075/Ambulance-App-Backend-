const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { sendNotification } = require('../controllers/notificationController');

router.use(verifyToken);

router.post('/send', sendNotification);

module.exports = router;
