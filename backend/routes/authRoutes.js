const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const { register, login, me, getMembers } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, me);
router.get('/members', protect, getMembers);

module.exports = router;
