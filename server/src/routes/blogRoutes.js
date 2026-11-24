const express = require('express');
const router = express.Router();
const {
  createBlog,
  getBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  getTags,
} = require('../controllers/blogController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getBlogs);
router.get('/tags', getTags);
router.get('/:id', optionalAuth, getBlog);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);
router.post('/:id/like', protect, toggleLike);

module.exports = router;