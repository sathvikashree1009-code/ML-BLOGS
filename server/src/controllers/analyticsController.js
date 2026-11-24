const Blog = require('../models/Blog');
const User = require('../models/User');

exports.myAnalytics = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ author: req.user._id });
    const totalViews = blogs.reduce((a, b) => a + (b.views || 0), 0);
    const totalLikes = blogs.reduce((a, b) => a + (b.likes?.length || 0), 0);
    const totalComments = 0;
    const topPosts = blogs
      .slice()
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 5)
      .map((b) => ({ id: b._id, title: b.title, views: b.views, likes: b.likes?.length || 0, createdAt: b.createdAt }));

    // views by day (last 14 days) - approximate using createdAt distribution
    const now = new Date();
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, views: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));
    for (const b of blogs) {
      const key = new Date(b.createdAt).toISOString().slice(0, 10);
      if (dayMap.has(key)) dayMap.get(key).views += b.views || 0;
    }

    res.json({
      totals: {
        posts: blogs.length,
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
      },
      topPosts,
      daily: days,
    });
  } catch (err) {
    next(err);
  }
};

exports.adminStats = async (req, res, next) => {
  try {
    const [users, blogs, flagged] = await Promise.all([
      User.countDocuments(),
      Blog.countDocuments(),
      Blog.countDocuments({ $or: [{ toxicScore: { $gte: 0.5 } }, { 'vulnReport.count': { $gt: 0 } }] }),
    ]);
    res.json({ users, blogs, flagged });
  } catch (err) {
    next(err);
  }
};

exports.flaggedContent = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ $or: [{ toxicScore: { $gte: 0.5 } }, { 'vulnReport.count': { $gt: 0 } }] })
      .populate('author', 'name email username')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ blogs });
  } catch (err) {
    next(err);
  }
};

exports.banUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.ban ? 'banned' : 'user' }, { new: true });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

exports.deleteBlogAdmin = async (req, res, next) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};