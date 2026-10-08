const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const {
  register,
  login,
  me,
  getMembers,
  updateProfile,
  uploadPhoto,
  deletePhoto,
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/members', protect, getMembers);
router.put('/profile', protect, updateProfile);
router.post('/photos', protect, uploadPhoto);
router.delete('/photos/:index', protect, deletePhoto);

module.exports = router;
