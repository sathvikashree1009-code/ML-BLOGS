const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendEmail = async (to, subject, html) => {
  if (!process.env.SMTP_HOST) {
    console.log(`[EMAIL-DEV] To: ${to}\nSubject: ${subject}\n${html}`);
    return false;
  }
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@mlblogs.com', to, subject, html });
  return true;
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    let base = (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 20) || 'user';
    let username = base;
    let i = 1;
    while (await User.findOne({ username })) { username = `${base}${i++}`; }
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({
      name,
      email,
      password,
      username,
      verifyToken,
      verifyTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}`;
    await sendEmail(email, 'Verify your ML Blogs account', `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`);
    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, skillLevel: user.skillLevel, username: user.username, isVerified: user.isVerified },
      verifyToken: process.env.SMTP_HOST ? undefined : verifyToken,
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
    if (user.role === 'banned') return res.status(403).json({ message: 'Account banned' });
    res.json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email, role: user.role, skillLevel: user.skillLevel, username: user.username, isVerified: user.isVerified },
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
    const { name, bio, avatar, githubUsername, username, fullName, contact, linkedin, website, location } = req.body;
    const update = { name, bio, avatar, githubUsername, fullName, contact, linkedin, website, location };
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

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    await sendEmail(email, 'Reset your ML Blogs password', `<p>Click to reset: <a href="${resetUrl}">${resetUrl}</a></p><p>Expires in 1 hour.</p>`);
    res.json({ message: 'If that email exists, a reset link has been sent.', token: process.env.SMTP_HOST ? undefined : token });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password required' });
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpiry: { $gt: new Date() } }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ verifyToken: token, verifyTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user.isVerified) return res.json({ message: 'Already verified' });
    const token = crypto.randomBytes(32).toString('hex');
    user.verifyToken = token;
    user.verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
    await sendEmail(user.email, 'Verify your ML Blogs account', `<p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>`);
    res.json({ message: 'Verification email sent', token: process.env.SMTP_HOST ? undefined : token });
  } catch (err) {
    next(err);
  }
};