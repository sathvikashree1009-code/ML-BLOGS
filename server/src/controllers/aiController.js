const axios = require('axios');
const Blog = require('../models/Blog');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

function ruleBased(task, content) {
  const words = (content || '').split(/\s+/).filter(Boolean);
  if (task === 'summary') {
    return words.slice(0, 40).join(' ') + (words.length > 40 ? '...' : '');
  }
  if (task === 'tags') {
    const freq = {};
    for (const w of words) {
      const t = w.toLowerCase().replace(/[^a-z]/g, '');
      if (t.length > 3) freq[t] = (freq[t] || 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([w]) => w).join(', ');
  }
  if (task === 'outline') {
    const headings = (content || '').split('\n').filter((l) => /^#{1,3}\s/.test(l));
    if (headings.length) return headings.join('\n');
    return `# Outline\n- Introduction\n- Main concepts\n- Code examples\n- Conclusion`;
  }
  return '';
}

exports.assist = async (req, res, next) => {
  try {
    const { content, task } = req.body;
    if (!content) return res.status(400).json({ message: 'content required' });
    const t = task || 'summary';

    // try Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const r = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: `You are a writing assistant. Task: ${t}. Be concise.` },
            { role: 'user', content },
          ],
          max_tokens: 400,
        }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 20000 });
        return res.json({ result: r.data.choices[0].message.content, llm: true });
      } catch (e) {}
    }
    res.json({ result: ruleBased(t, content), llm: false });
  } catch (err) {
    next(err);
  }
};

// Plagiarism / duplicate detection
exports.checkDuplicate = async (req, res, next) => {
  try {
    const { content, title, excludeId } = req.body;
    const candidates = await Blog.find({ status: 'published', _id: { $ne: excludeId } }).select('title content _id').limit(200);
    const tokenize = (s) => new Set((s || '').toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    const target = tokenize(`${title} ${content}`);
    let best = { score: 0, blog: null };
    for (const c of candidates) {
      const other = tokenize(`${c.title} ${c.content}`);
      const inter = [...target].filter((w) => other.has(w)).length;
      const union = new Set([...target, ...other]).size;
      const jaccard = union ? inter / union : 0;
      if (jaccard > best.score) best = { score: jaccard, blog: c };
    }
    res.json({
      duplicate: best.score >= 0.6,
      score: Math.round(best.score * 100),
      similarBlog: best.blog ? { id: best.blog._id, title: best.blog.title } : null,
    });
  } catch (err) {
    next(err);
  }
};