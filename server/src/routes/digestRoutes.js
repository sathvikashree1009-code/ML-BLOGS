const express = require('express');
const router = express.Router();
const { subscribe, preview, sendDigest } = require('../controllers/digestController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/subscribe', subscribe);
router.get('/preview', preview);
router.post('/send', protect, adminOnly, sendDigest);

module.exports = router;