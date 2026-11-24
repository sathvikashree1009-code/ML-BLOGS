const express = require('express');
const router = express.Router();
const { resolveRepo } = require('../controllers/githubController');
const { protect } = require('../middleware/auth');

router.get('/repo', protect, resolveRepo);
router.post('/repo', protect, resolveRepo);

module.exports = router;