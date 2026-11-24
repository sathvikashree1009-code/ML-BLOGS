const express = require('express');
const router = express.Router();
const { feed } = require('../controllers/rssController');

router.get('/feed.xml', feed);

module.exports = router;