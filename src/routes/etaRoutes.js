const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { getEta } = require('../controllers/etaController');

router.use(verifyToken);

router.get('/', getEta);

module.exports = router;
