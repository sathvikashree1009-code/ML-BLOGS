const User = require('../models/User');
const Blog = require('../models/Blog');

exports.computeSkill = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const blogs = await Blog.find({ author: userId });
    const blogCount = blogs.length;
    const totalWords = blogs.reduce((a, b) => a + (b.content || '').split(/\s+/).length, 0);
    const avgWords = blogCount ? Math.round(totalWords / blogCount) : 0;
    const codeBlocks = blogs.reduce((a, b) => a + ((b.content || '').match(/```/g) || []).length / 2, 0);
    const tagSet = new Set(blogs.flatMap((b) => b.tags || []));
    const tagDiversity = tagSet.size;
    const readCount = (req.user.readHistory || []).length;

    let level = 'beginner';
    if (blogCount >= 8 && avgWords >= 500 && codeBlocks >= 5) level = 'advanced';
    else if (blogCount >= 3 && avgWords >= 200) level = 'intermediate';

    await User.findByIdAndUpdate(userId, { skillLevel: level });

    res.json({
      skillLevel: level,
      metrics: { blogCount, avgWords, codeBlocks: Math.round(codeBlocks), tagDiversity, readCount },
    });
  } catch (err) {
    next(err);
  }
};