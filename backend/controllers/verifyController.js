const User = require('../models/User');
const { sendEmailCode, sendSmsCode } = require('../config/notify');

const genCode = () => String(Math.floor(100000 + Math.random() * 900000));
const checkBoth = (user) => { user.isVerified = user.emailVerified && user.phoneVerified; };

exports.setPhone = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !phone.trim()) return res.status(400).json({ message: 'Phone number required' });

    const cleanPhone = String(phone).trim();
    if (!/^\+?\d{8,15}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Use international format, e.g. +254712345678' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const taken = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
    if (taken) return res.status(400).json({ message: 'This phone is already registered' });

    user.phone = cleanPhone;
    await user.save();
    res.json({ message: 'Phone saved', phone: user.phone });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendEmailVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ message: 'Email already verified' });

    const code = genCode();
    user.emailCode = { code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
    await user.save();
    await sendEmailCode(user.email, code);
    res.json({ message: `Code sent to ${user.email}` });
  } catch (err) {
    console.error('sendEmailVerification error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.checkEmailCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.emailCode.code || !user.emailCode.expiresAt) return res.status(400).json({ message: 'No pending email code' });
    if (new Date() > user.emailCode.expiresAt) return res.status(400).json({ message: 'Code expired' });
    if (user.emailCode.code !== String(code).trim()) return res.status(400).json({ message: 'Wrong code' });

    user.emailVerified = true;
    user.emailCode = { code: '', expiresAt: null };
    checkBoth(user);
    await user.save();
    res.json({ message: 'Email verified', emailVerified: user.emailVerified, phoneVerified: user.phoneVerified, isVerified: user.isVerified });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendPhoneVerification = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.phoneVerified) return res.status(400).json({ message: 'Phone already verified' });
    if (!user.phone || user.phone.trim() === '') return res.status(400).json({ message: 'Add a phone number first' });

    const code = genCode();
    user.phoneCode = { code, expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
    await user.save();
    await sendSmsCode(user.phone, code);
    res.json({ message: `SMS sent to ${user.phone}` });
  } catch (err) {
    console.error('sendPhoneVerification error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.checkPhoneCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!user.phoneCode.code || !user.phoneCode.expiresAt) return res.status(400).json({ message: 'No pending phone code' });
    if (new Date() > user.phoneCode.expiresAt) return res.status(400).json({ message: 'Code expired' });
    if (user.phoneCode.code !== String(code).trim()) return res.status(400).json({ message: 'Wrong code' });

    user.phoneVerified = true;
    user.phoneCode = { code: '', expiresAt: null };
    checkBoth(user);
    await user.save();
    res.json({ message: 'Phone verified', emailVerified: user.emailVerified, phoneVerified: user.phoneVerified, isVerified: user.isVerified });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
