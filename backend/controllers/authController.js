const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.register = async (req, res) => {
  try {
    const { name, email, password, age, gender, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    if (age && Number(age) < 18) {
      return res.status(400).json({ message: 'You must be 18 or older' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, email: email.toLowerCase(), password: hashed, age, gender, city,
    });

    res.status(201).json({
      token: signToken(user._id),
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        isVerified: user.isVerified, isPremium: user.isPremium,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastSeen = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({
      token: signToken(user._id),
      user: {
        id: user._id, name: user.name, email: user.email, role: user.role,
        isVerified: user.isVerified, isPremium: user.isPremium,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  res.json({ user: req.user });
};

exports.getMembers = async (req, res) => {
  try {
    const members = await User.find({ _id: { $ne: req.user._id } })
      .select('name age city bio photos interests isVerified isPremium lastSeen')
      .limit(50);
    res.json({ members });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
