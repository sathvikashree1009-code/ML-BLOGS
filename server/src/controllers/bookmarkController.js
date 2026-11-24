const User = require('../models/User');
const Blog = require('../models/Blog');

exports.toggleBookmark = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = user.bookmarks.indexOf(req.params.blogId);
    if (idx === -1) user.bookmarks.push(req.params.blogId);
    else user.bookmarks.splice(idx, 1);
    await user.save();
    res.json({ bookmarked: idx === -1 });
  } catch (err) {
    next(err);
  }
};

exports.getBookmarks = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'author', select: 'name avatar skillLevel' },
    });
    res.json({ blogs: user.bookmarks || [] });
  } catch (err) {
    next(err);
  }
};

exports.getRelated = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Not found' });
    const candidates = await Blog.find({ status: 'published', _id: { $ne: blog._id } })
      .populate('author', 'name avatar skillLevel')
      .limit(50);
    const targetTags = new Set((blog.tags || []).map((t) => t.toLowerCase()));
    const scored = candidates.map((c) => {
      const overlap = (c.tags || []).filter((t) => targetTags.has(t.toLowerCase())).length;
      return { blog: c, score: overlap * 10 + (c.views || 0) * 0.01 };
    });
    scored.sort((a, b) => b.score - a.score);
    res.json({ blogs: scored.slice(0, 6).map((s) => s.blog) });
  } catch (err) {
    next(err);
  }
};