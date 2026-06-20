const express = require('express');
const router = express.Router();
const { generateResponse } = require('../controllers/chatbotController');
const { verifyToken } = require('../middleware/authMiddleware');

// Define route (protected by auth)
router.post('/', verifyToken, generateResponse);

module.exports = router;
