const express = require('express');
const router = express.Router();
const {
  getComments,
  createComment,
  deleteComment,
  toggleLike,
} = require('../controllers/commentController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/blog/:blogId', optionalAuth, getComments);
router.post('/blog/:blogId', protect, createComment);
router.delete('/:id', protect, deleteComment);
router.post('/:id/like', protect, toggleLike);

module.exports = router;