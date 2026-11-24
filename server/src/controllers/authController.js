const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    // generate unique username
    let base = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'user';
    let username = base;
    let i = 1;
    while (await User.findOne({ username })) { username = `${base}${i++}`; }
    const user = await User.create({ name, email, password, username });
    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, skillLevel: user.skillLevel },
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, skillLevel: user.skillLevel },
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar, githubUsername, username } = req.body;
    const update = { name, bio, avatar, githubUsername };
    if (username) {
      const taken = await User.findOne({ username: username.toLowerCase(), _id: { $ne: req.user._id } });
      if (taken) return res.status(400).json({ message: 'Username already taken' });
      update.username = username.toLowerCase();
    }
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true }).select('-password');
    res.json({ user });
  } catch (err) {
    next(err);
  }
};