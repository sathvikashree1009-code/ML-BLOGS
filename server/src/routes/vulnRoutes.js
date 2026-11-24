const express = require('express');
const router = express.Router();
const { scan } = require('../controllers/vulnController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/scan', optionalAuth, scan);

module.exports = router;