const express = require('express');
const router = express.Router();
const { assist, checkDuplicate } = require('../controllers/aiController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/assist', optionalAuth, assist);
router.post('/check-duplicate', optionalAuth, checkDuplicate);

module.exports = router;