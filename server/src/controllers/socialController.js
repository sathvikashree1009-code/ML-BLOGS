const User = require('../models/User');
const Blog = require('../models/Blog');

async function findUser(identifier) {
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    return User.findById(identifier).select('-password');
  }
  return User.findOne({ username: identifier.toLowerCase() }).select('-password');
}

exports.getProfile = async (req, res, next) => {
  try {
    const user = await findUser(req.params.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const blogs = await Blog.find({ author: user._id, status: 'published' })
      .populate('author', 'name avatar skillLevel username')
      .sort({ createdAt: -1 });
    const isFollowing = req.user ? user.followers.some((f) => f.toString() === req.user._id.toString()) : false;
    res.json({
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        skillLevel: user.skillLevel,
        githubUsername: user.githubUsername,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        isFollowing,
      },
      blogs,
    });
  } catch (err) {
    next(err);
  }
};

exports.toggleFollow = async (req, res, next) => {
  try {
    const target = await findUser(req.params.username);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot follow yourself' });

    const me = await User.findById(req.user._id);
    const idx = me.following.indexOf(target._id);
    if (idx === -1) {
      me.following.push(target._id);
      target.followers.push(me._id);
    } else {
      me.following.splice(idx, 1);
      const fi = target.followers.indexOf(me._id);
      if (fi !== -1) target.followers.splice(fi, 1);
    }
    await me.save();
    await target.save();
    res.json({ following: idx === -1, followersCount: target.followers.length });
  } catch (err) {
    next(err);
  }
};

exports.getFollowers = async (req, res, next) => {
  try {
    const user = await findUser(req.params.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const populated = await User.findById(user._id).populate('followers', 'name username avatar skillLevel');
    res.json({ users: populated.followers });
  } catch (err) {
    next(err);
  }
};

exports.getFollowing = async (req, res, next) => {
  try {
    const user = await findUser(req.params.username);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const populated = await User.findById(user._id).populate('following', 'name username avatar skillLevel');
    res.json({ users: populated.following });
  } catch (err) {
    next(err);
  }
};

exports.getFeed = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id);
    const following = me.following || [];
    if (following.length === 0) return res.json({ blogs: [], page: 1, pages: 1 });
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const filter = { status: 'published', author: { $in: following } };
    const [blogs, total] = await Promise.all([
      Blog.find(filter).populate('author', 'name avatar skillLevel username').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Blog.countDocuments(filter),
    ]);
    res.json({ blogs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};