const express = require('express');
const router = express.Router();
const {
  getProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  getFeed,
} = require('../controllers/socialController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/feed', protect, getFeed);
router.get('/u/:username', optionalAuth, getProfile);
router.post('/u/:username/follow', protect, toggleFollow);
router.get('/u/:username/followers', optionalAuth, getFollowers);
router.get('/u/:username/following', optionalAuth, getFollowing);

module.exports = router;