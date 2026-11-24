const Blog = require('../models/Blog');
const User = require('../models/User');
const { recommend } = require('../services/mlService');

exports.getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const likedTags = user.likedTags || [];
    // derive tags from read history
    const readBlogs = await Blog.find({ _id: { $in: user.readHistory || [] } }).select('tags');
    const readTags = readBlogs.flatMap((b) => b.tags || []);

    const candidates = await Blog.find({ status: 'published' })
      .select('_id tags views likes')
      .limit(200);

    const candidatePayload = candidates.map((c) => ({
      id: c._id.toString(),
      tags: c.tags,
      views: c.views,
      likes: c.likes,
    }));

    const ids = await recommend({ likedTags, readTags, candidates: candidatePayload });
    const idSet = new Set(ids);
    const ordered = ids
      .map((id) => candidates.find((c) => c._id.toString() === id))
      .filter(Boolean);

    // populate full blogs
    const blogs = await Blog.find({ _id: { $in: ordered.map((c) => c._id) } })
      .populate('author', 'name avatar skillLevel');
    const byId = new Map(blogs.map((b) => [b._id.toString(), b]));
    const result = ordered.map((c) => byId.get(c._id.toString())).filter(Boolean);

    res.json({ blogs: result });
  } catch (err) {
    next(err);
  }
};