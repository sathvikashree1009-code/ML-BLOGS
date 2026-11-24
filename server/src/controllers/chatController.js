const axios = require('axios');
const Blog = require('../models/Blog');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

exports.chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: 'message required' });

    // If user asks to search/find, fetch matching blogs to include as context
    let context = '';
    const lower = message.toLowerCase();
    if (lower.includes('search') || lower.includes('find') || lower.includes('blog')) {
      const q = message.replace(/search|find|blogs?|about/gi, '').trim();
      if (q.length > 2) {
        const blogs = await Blog.find({ status: 'published', $text: { $search: q } }).limit(5).select('title _id tags');
        if (blogs.length) {
          context = 'Relevant blogs: ' + blogs.map((b) => `${b.title} (/blog/${b._id})`).join('; ');
        }
      }
    }

    const { data } = await axios.post(`${ML_URL}/chat`, { message, context }, { timeout: 25000 });
    res.json({ reply: data.reply, llm: data.llm });
  } catch (err) {
    res.json({ reply: "Sorry, I'm having trouble connecting. Try again later.", llm: false });
  }
};