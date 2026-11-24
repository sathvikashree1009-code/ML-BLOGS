const express = require('express');
const router = express.Router();
const { semanticSearch } = require('../controllers/searchController');
const { optionalAuth } = require('../middleware/auth');

router.get('/semantic', optionalAuth, semanticSearch);

module.exports = router;