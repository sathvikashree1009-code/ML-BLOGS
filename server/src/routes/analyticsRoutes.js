const express = require('express');
const router = express.Router();
const {
  myAnalytics,
  adminStats,
  flaggedContent,
  banUser,
  deleteBlogAdmin,
} = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/me', protect, myAnalytics);
router.get('/admin/stats', protect, adminOnly, adminStats);
router.get('/admin/flagged', protect, adminOnly, flaggedContent);
router.post('/admin/users/:id/ban', protect, adminOnly, banUser);
router.delete('/admin/blogs/:id', protect, adminOnly, deleteBlogAdmin);

module.exports = router;