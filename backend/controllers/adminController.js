const User = require('../models/User');

// Password check middleware
exports.requirePassword = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid admin password' });
  }
  next();
};

// POST /api/admin/login
exports.login = (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password required' });
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid password' });
  }
  res.json({ ok: true, message: 'Admin unlocked' });
};

// GET /api/admin/users — all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    const stats = {
      total: users.length,
      verified: users.filter((u) => u.isVerified).length,
      pending: users.filter((u) => u.verification?.status === 'pending').length,
      members: users.filter((u) => u.role === 'member').length,
    };
    res.json({ stats, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/admin/users/:userId
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await User.findByIdAndDelete(userId);
    res.json({ message: `Deleted ${user.name}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/verify/:userId
exports.verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { decision, reason } = req.body;

    if (!['approved', 'rejected', 'unverified'].includes(decision)) {
      return res.status(400).json({ message: 'Decision must be approved, rejected, or unverified' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.verification.status = decision;
    user.verification.reviewedAt = new Date();
    user.verification.rejectionReason = decision === 'rejected' ? (reason || '') : '';
    user.isVerified = decision === 'approved';

    await user.save();

    res.json({
      message: `User ${decision}`,
      user: {
        id: user._id,
        name: user.name,
        isVerified: user.isVerified,
        verification: user.verification,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
