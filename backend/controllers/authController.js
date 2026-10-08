const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');

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

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'age', 'gender', 'city', 'bio', 'interests', 'lookingFor', 'budgetRange'];
    const updates = {};

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (updates.age && Number(updates.age) < 18) {
      return res.status(400).json({ message: 'You must be 18 or older' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, runValidators: true,
    }).select('-password');

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ message: 'Image data is required' });
    }

    if (image.length > 4 * 1024 * 1024) {
      return res.status(400).json({ message: 'Image too large (max ~3MB)' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.photos.length >= 6) {
      return res.status(400).json({ message: 'Maximum 6 photos allowed' });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: 'oslos/profiles',
      transformation: [
        { width: 1000, height: 1250, crop: 'limit' },
        { quality: 'auto:good' },
        { fetch_format: 'auto' },
      ],
    });

    user.photos.push(result.secure_url);
    await user.save();

    res.json({ photos: user.photos, url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const { index } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const i = Number(index);
    if (i < 0 || i >= user.photos.length) {
      return res.status(400).json({ message: 'Invalid photo index' });
    }

    const url = user.photos[i];

    if (url.includes('res.cloudinary.com')) {
      try {
        const parts = url.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1) {
          const afterUpload = parts.slice(uploadIndex + 2).join('/');
          const publicId = afterUpload.replace(/\.[^/.]+$/, '');
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {
        console.log('Cloudinary delete failed (non-fatal):', e.message);
      }
    }

    user.photos.splice(i, 1);
    await user.save();

    res.json({ photos: user.photos });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============= VERIFICATION =============

// Submit ID + selfie for verification
exports.submitVerification = async (req, res) => {
  try {
    const { idPhoto, selfie } = req.body;
    if (!idPhoto || !selfie) {
      return res.status(400).json({ message: 'ID photo and selfie are required' });
    }

    if (idPhoto.length > 5 * 1024 * 1024 || selfie.length > 5 * 1024 * 1024) {
      return res.status(400).json({ message: 'Each image must be under ~4MB' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.verification.status === 'pending') {
      return res.status(400).json({ message: 'Verification already pending review' });
    }
    if (user.verification.status === 'approved') {
      return res.status(400).json({ message: 'You are already verified' });
    }

    // Upload ID photo to a private folder
    const idResult = await cloudinary.uploader.upload(idPhoto, {
      folder: 'oslos/verification/ids',
      type: 'private',
    });

    // Upload selfie
    const selfieResult = await cloudinary.uploader.upload(selfie, {
      folder: 'oslos/verification/selfies',
      type: 'private',
    });

    user.verification = {
      status: 'pending',
      idPhotoUrl: idResult.secure_url,
      selfieUrl: selfieResult.secure_url,
      submittedAt: new Date(),
      reviewedAt: null,
      rejectionReason: '',
    };
    await user.save();

    res.json({
      message: 'Verification submitted. Our team will review within 24 hours.',
      verification: {
        status: user.verification.status,
        submittedAt: user.verification.submittedAt,
      },
    });
  } catch (err) {
    console.error('Verification upload error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Admin: list all pending verifications
exports.getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({ 'verification.status': 'pending' })
      .select('name email age city photos verification')
      .sort({ 'verification.submittedAt': 1 });
    res.json({ count: users.length, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin: approve or reject a verification
exports.reviewVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision, reason } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved or rejected' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verification.status = decision;
    user.verification.reviewedAt = new Date();
    user.verification.rejectionReason = decision === 'rejected' ? (reason || '') : '';
    user.isVerified = decision === 'approved';

    await user.save();

    res.json({
      message: `Verification ${decision}`,
      user: { id: user._id, name: user.name, isVerified: user.isVerified },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
