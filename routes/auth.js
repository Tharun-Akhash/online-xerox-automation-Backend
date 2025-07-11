
const express = require('express');
const {
  registerStudent,
  loginStudent,
  getCurrentStudent,
  logoutStudent,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');

const { protect } = require('../middleware/auth');
const { 
  validateStudentRegistration,
  validateStudentLogin,
  validateForgotPassword,
  validateResetPassword,
  handleValidationErrors
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validateStudentRegistration, handleValidationErrors, registerStudent);
router.post('/login', validateStudentLogin, handleValidationErrors, loginStudent);
router.post('/forgot-password', validateForgotPassword, handleValidationErrors, forgotPassword);
router.put('/reset-password/:resetToken', validateResetPassword, handleValidationErrors, resetPassword);

// Protected routes
router.get('/me', protect, getCurrentStudent);
router.post('/logout', protect, logoutStudent);

module.exports = router;