const express = require('express');
const router = express.Router();
const { computeSkill } = require('../controllers/skillController');
const { protect } = require('../middleware/auth');

router.get('/me', protect, computeSkill);

module.exports = router;