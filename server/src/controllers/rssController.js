const Blog = require('../models/Blog');

exports.feed = async (req, res, next) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(20);
    const items = blogs.map((b) => `
    <item>
      <title><![CDATA[${b.title}]]></title>
      <link>http://localhost:5173/blog/${b._id}</link>
      <guid>http://localhost:5173/blog/${b._id}</guid>
      <pubDate>${new Date(b.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${(b.excerpt || '').slice(0, 300)}]]></description>
      <author>${b.author?.name || ''}</author>
    </item>`).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ML Blogs</title>
    <link>http://localhost:5173</link>
    <description>ML-based blogging platform for developers</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;
    res.set('Content-Type', 'application/rss+xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
};