const express = require('express');
const router = express.Router();
const { middleware, uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

router.post('/', protect, middleware, uploadImage);

module.exports = router;