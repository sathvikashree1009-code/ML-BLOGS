const Comment = require('../models/Comment');
const Blog = require('../models/Blog');

exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ blog: req.params.blogId })
      .populate('author', 'name avatar skillLevel')
      .sort({ createdAt: 1 });
    res.json({ comments });
  } catch (err) {
    next(err);
  }
};

exports.createComment = async (req, res, next) => {
  try {
    const { content, parent } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Content required' });
    const blog = await Blog.findById(req.params.blogId);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    const comment = await Comment.create({
      blog: blog._id,
      author: req.user._id,
      content,
      parent: parent || null,
    });
    await comment.populate('author', 'name avatar skillLevel');
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
};

exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });
    await comment.deleteOne();
    // delete replies
    await Comment.deleteMany({ parent: comment._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    const idx = comment.likes.indexOf(req.user._id);
    if (idx === -1) comment.likes.push(req.user._id);
    else comment.likes.splice(idx, 1);
    await comment.save();
    res.json({ likes: comment.likes.length, liked: idx === -1 });
  } catch (err) {
    next(err);
  }
};