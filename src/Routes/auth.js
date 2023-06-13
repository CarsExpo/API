const router = require('express').Router();
const authController = require('../Controllers/authControllers');

router.post('/register', authController.register);
router.post('/verify-otp', authController.verify);
router.post('/resend-otp', authController.resendOTP);
router.post('/login', authController.login);
router.post('/forget-password', authController.forgetPass);
router.post('/reset-password/:token', authController.resetPass);

module.exports = router;
