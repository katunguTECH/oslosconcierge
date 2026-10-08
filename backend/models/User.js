const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['member', 'concierge', 'admin'], default: 'member' },
    age: { type: Number, min: 18 },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    city: { type: String, default: '' },
    bio: { type: String, default: '', maxlength: 500 },
    photos: [{ type: String }],
    interests: [{ type: String }],
    lookingFor: { type: String, default: '' },
    budgetRange: { type: String, default: '' },
    isVerified: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    emailCode: {
      code: { type: String, default: '' },
      expiresAt: { type: Date, default: null },
    },
    phoneCode: {
      code: { type: String, default: '' },
      expiresAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
