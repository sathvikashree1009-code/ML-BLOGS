const Subscriber = require('../models/Subscriber');
const Blog = require('../models/Blog');

exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email required' });
    await Subscriber.updateOne({ email: email.toLowerCase() }, { email: email.toLowerCase() }, { upsert: true });
    res.json({ message: 'Subscribed' });
  } catch (err) {
    next(err);
  }
};

exports.preview = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const blogs = await Blog.find({ status: 'published', createdAt: { $gte: since } })
      .populate('author', 'name')
      .sort({ views: -1 })
      .limit(5);
    const digest = blogs.map((b) => ({ title: b.title, url: `/blog/${b._id}`, author: b.author?.name, views: b.views }));
    res.json({ digest, count: blogs.length });
  } catch (err) {
    next(err);
  }
};

exports.sendDigest = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const blogs = await Blog.find({ status: 'published', createdAt: { $gte: since } })
      .populate('author', 'name')
      .sort({ views: -1 })
      .limit(5);
    const subs = await Subscriber.find();
    const nodemailer = require('nodemailer');
    let transporter = null;
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
    }
    const html = `<h2>Weekly top posts</h2><ul>${blogs.map((b) => `<li><a href="http://localhost:5173/blog/${b._id}">${b.title}</a> by ${b.author?.name} (${b.views} views)</li>`).join('')}</ul>`;
    let sent = 0;
    if (transporter) {
      for (const s of subs) {
        try {
          await transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@mlblogs.com', to: s.email, subject: 'ML Blogs weekly digest', html });
          sent++;
        } catch (e) {}
      }
    }
    res.json({ subscribers: subs.length, sent, preview: blogs.map((b) => b.title) });
  } catch (err) {
    next(err);
  }
};