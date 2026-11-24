const express = require('express');
const router = express.Router();
const { toggleBookmark, getBookmarks, getRelated } = require('../controllers/bookmarkController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', protect, getBookmarks);
router.post('/:blogId', protect, toggleBookmark);
router.get('/related/:id', optionalAuth, getRelated);

module.exports = router;