const Blog = require('../models/Blog');
const User = require('../models/User');
const { toxicCheck, vulnScan } = require('../services/mlService');

exports.createBlog = async (req, res, next) => {
  try {
    const { title, content, tags, coverImage, repo, status, scheduledFor } = req.body;
    const fullText = `${title}\n${content}`;
    const check = await toxicCheck(fullText);
    if (check.toxic) {
      return res.status(400).json({
        message: 'Content flagged as toxic and cannot be published',
        score: check.score,
        reason: check.reason,
        flagged: check.flagged,
      });
    }
    const scan = await vulnScan({ markdown: content });
    const blog = await Blog.create({
      author: req.user._id,
      title,
      content,
      tags: (tags || []).map((t) => t.toLowerCase().trim()),
      coverImage,
      repo,
      status: status || 'published',
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      publishedAt: (status === 'published' || !status) ? new Date() : undefined,
      toxicScore: check.score,
      vulnReport: scan,
    });
    await blog.populate('author', 'name avatar skillLevel');
    res.status(201).json({ blog, toxicScore: check.score, vulnReport: scan });
  } catch (err) {
    next(err);
  }
};

exports.getBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const tag = req.query.tag;
    const author = req.query.author;
    const search = req.query.search;
    const dateFrom = req.query.dateFrom;
    const dateTo = req.query.dateTo;

    // auto-publish scheduled posts that are due
    await Blog.updateMany(
      { status: 'scheduled', scheduledFor: { $lte: new Date() } },
      { $set: { status: 'published', publishedAt: new Date() } }
    );

    const filter = { status: 'published' };
    if (tag) filter.tags = tag.toLowerCase();
    if (author) filter.author = author;
    if (search) filter.$text = { $search: search };
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    const minRead = parseInt(req.query.minRead);
    if (minRead) {
      // handled post-fetch; mark flag
      req._minRead = minRead;
    }

    let blogs = await Blog.find(filter)
      .populate('author', 'name avatar skillLevel')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    const total = await Blog.countDocuments(filter);
    if (req._minRead) {
      blogs = blogs.filter((b) => {
        const words = (b.content || '').trim().split(/\s+/).filter(Boolean).length;
        const mins = Math.max(1, Math.round(words / 200));
        return mins >= req._minRead;
      });
    }
    res.json({ blogs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findOne({ $or: [{ _id: req.params.id }, { slug: req.params.id }] })
      .populate('author', 'name avatar skillLevel bio githubUsername');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    blog.views += 1;
    await blog.save();
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { readHistory: blog._id },
        $addToSet: { likedTags: { $each: blog.tags } },
      });
    }
    res.json({ blog });
  } catch (err) {
    next(err);
  }
};

exports.updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });
    const { title, content, tags, coverImage, repo, status, scheduledFor } = req.body;
    const newTitle = title ?? blog.title;
    const newContent = content ?? blog.content;
    if (title !== undefined || content !== undefined) {
      const check = await toxicCheck(`${newTitle}\n${newContent}`);
      if (check.toxic) {
        return res.status(400).json({
          message: 'Content flagged as toxic and cannot be saved',
          score: check.score,
          reason: check.reason,
          flagged: check.flagged,
        });
      }
      blog.toxicScore = check.score;
    }
    const scan = (title !== undefined || content !== undefined) ? await vulnScan({ markdown: newContent }) : blog.vulnReport;
    Object.assign(blog, {
      title: newTitle,
      content: newContent,
      tags: tags ? tags.map((t) => t.toLowerCase().trim()) : blog.tags,
      coverImage: coverImage ?? blog.coverImage,
      repo: repo ?? blog.repo,
      status: status ?? blog.status,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : blog.scheduledFor,
      publishedAt: (status === 'published' && !blog.publishedAt) ? new Date() : blog.publishedAt,
      vulnReport: scan,
    });
    await blog.save();
    await blog.populate('author', 'name avatar skillLevel');
    res.json({ blog });
  } catch (err) {
    next(err);
  }
};

exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    if (blog.author.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not allowed' });
    await blog.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};

exports.toggleLike = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    const idx = blog.likes.indexOf(req.user._id);
    if (idx === -1) blog.likes.push(req.user._id);
    else blog.likes.splice(idx, 1);
    await blog.save();
    res.json({ likes: blog.likes.length, liked: idx === -1 });
  } catch (err) {
    next(err);
  }
};

exports.getTags = async (req, res, next) => {
  try {
    const tags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ tags: tags.map((t) => ({ name: t._id, count: t.count })) });
  } catch (err) {
    next(err);
  }
};