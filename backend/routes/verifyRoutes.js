const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const ctrl = require('../controllers/verifyController');

router.post('/set-phone', protect, ctrl.setPhone);
router.post('/send-email', protect, ctrl.sendEmailVerification);
router.post('/check-email', protect, ctrl.checkEmailCode);
router.post('/send-phone', protect, ctrl.sendPhoneVerification);
router.post('/check-phone', protect, ctrl.checkPhoneCode);

module.exports = router;
