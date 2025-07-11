const { body, validationResult } = require('express-validator');

// Validation rules for student registration
const validateStudentRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .custom((value) => {
      if (!value.endsWith('@srec.ac.in')) {
        throw new Error('Email must end with @srec.ac.in');
      }
      return true;
    })
    .normalizeEmail(),

  body('rollNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage('Roll number must be exactly 10 digits')
    .isNumeric()
    .withMessage('Roll number must contain only numbers')
    .custom((value) => {
      if (!value.startsWith('7181')) {
        throw new Error('Roll number must start with 7181');
      }
      return true;
    }),

  body('phoneNumber')
    .isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be exactly 10 digits')
    .isNumeric()
    .withMessage('Phone number must contain only numbers')
    .custom((value) => {
      if (!['6', '7', '8', '9'].includes(value.charAt(0))) {
        throw new Error('Phone number must start with 6, 7, 8, or 9');
      }
      return true;
    }),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Validation rules for student login
const validateStudentLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for forgot password
const validateForgotPassword = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
];

// Validation rules for reset password
const validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// ✅ ADD THIS: Validation rules for print job creation
const validatePrintJob = [
  body('totalPages')
    .isInt({ min: 1 })
    .withMessage('Total pages must be a positive integer'),
  
  body('numCopies')
    .isInt({ min: 1, max: 100 })
    .withMessage('Number of copies must be between 1 and 100'),
  
  body('printingType')
    .isIn(['bw', 'colour', 'mixed', 'poster'])
    .withMessage('Invalid printing type'),
  
  body('printingSide')
    .isIn(['single', 'double'])
    .withMessage('Invalid printing side option'),
  
  body('finishingOption')
    .isIn(['none', 'spiral', 'caligo', 'stickfile'])
    .withMessage('Invalid finishing option'),
  
  // Optional fields
  body('colorPages')
    .optional()
    .isString()
    .withMessage('Color pages must be a string'),
  
  body('specialInstructions')
    .optional()
    .isString()
    .withMessage('Special instructions must be a string')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = {};
    
    errors.array().forEach(error => {
      errorMessages[error.path] = error.msg;
    });
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

module.exports = {
  validateStudentRegistration,
  validateStudentLogin,
  validateForgotPassword,
  validateResetPassword,
  validatePrintJob,  // ✅ ADD THIS LINE
  handleValidationErrors
};