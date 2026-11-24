const Blog = require('../models/Blog');
const { recommend } = require('../services/mlService');
const axios = require('axios');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.semanticSearch = async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) return res.json({ blogs: [], engine: 'none' });

    const candidates = await Blog.find({ status: 'published' })
      .populate('author', 'name avatar skillLevel')
      .limit(200);

    const payload = candidates.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      content: b.content,
      tags: b.tags,
    }));

    let rankedIds = [];
    let engine = 'text';
    try {
      const { data } = await axios.post(`${ML_URL}/semantic-search`, { query: q, blogs: payload }, { timeout: 30000 });
      rankedIds = data.rankedIds || [];
      engine = data.engine || 'ml';
    } catch (e) {
      // fallback: mongo text search
      const textMatches = await Blog.find({ status: 'published', $text: { $search: q } })
        .populate('author', 'name avatar skillLevel');
      return res.json({ blogs: textMatches, engine: 'mongo-text' });
    }

    const byId = new Map(candidates.map((b) => [b._id.toString(), b]));
    const result = rankedIds.map((id) => byId.get(id)).filter(Boolean);
    res.json({ blogs: result, engine });
  } catch (err) {
    next(err);
  }
};