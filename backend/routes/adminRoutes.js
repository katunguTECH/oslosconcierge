const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');

router.post('/login', admin.login);
router.get('/users', admin.requirePassword, admin.getAllUsers);
router.delete('/users/:userId', admin.requirePassword, admin.deleteUser);
router.post('/verify/:userId', admin.requirePassword, admin.verifyUser);

module.exports = router;
