const express = require('express');
const router = express.Router();
const { runPython } = require('../controllers/runController');
const { optionalAuth } = require('../middleware/auth');

router.post('/python', optionalAuth, runPython);

module.exports = router;