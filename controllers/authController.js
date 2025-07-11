
const Student = require('../models/Student');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register Student
const registerStudent = async (req, res) => {
  try {
    const { email, rollNumber, phoneNumber, password } = req.body;

    // Check if student already exists by email
    const existingStudentByEmail = await Student.findOne({ email });
    if (existingStudentByEmail) {
      return res.status(400).json({
        success: false,
        message: 'Student with this email already exists',
        errors: { email: 'Email already registered' }
      });
    }

    // Check if student already exists by roll number
    const existingStudentByRoll = await Student.findOne({ rollNumber });
    if (existingStudentByRoll) {
      return res.status(400).json({
        success: false,
        message: 'Student with this roll number already exists',
        errors: { rollNumber: 'Roll number already registered' }
      });
    }

    // Check if student already exists by phone number
    const existingStudentByPhone = await Student.findOne({ phoneNumber });
    if (existingStudentByPhone) {
      return res.status(400).json({
        success: false,
        message: 'Student with this phone number already exists',
        errors: { phoneNumber: 'Phone number already registered' }
      });
    }

    // Create new student
    const student = await Student.create({
      email,
      rollNumber,
      phoneNumber,
      password
    });

    // Generate token
    const token = generateToken(student._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.status(201)
       .cookie('token', token, cookieOptions)
       .json({
         success: true,
         message: 'Student registered successfully',
         data: {
           student,
           token
         }
       });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const errors = {};
      
      if (field === 'email') {
        errors.email = 'Email already registered';
      } else if (field === 'rollNumber') {
        errors.rollNumber = 'Roll number already registered';
      } else if (field === 'phoneNumber') {
        errors.phoneNumber = 'Phone number already registered';
      }
      
      return res.status(400).json({
        success: false,
        message: 'Registration failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login Student
const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find student by email and include password for comparison
    const student = await Student.findOne({ email }).select('+password');
    
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: { email: 'Email not found' }
      });
    }

    // Check password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        errors: { password: 'Incorrect password' }
      });
    }

    // Generate token
    const token = generateToken(student._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    // Remove password from response
    student.password = undefined;

    res.status(200)
       .cookie('token', token, cookieOptions)
       .json({
         success: true,
         message: 'Login successful',
         data: {
           student,
           token
         }
       });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout Student
const logoutStudent = (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Get Current Student
const getCurrentStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { student }
    });

  } catch (error) {
    console.error('Get current student error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
        errors: { email: 'Email not found' }
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    student.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire time (10 minutes)
    student.resetPasswordExpires = Date.now() + 10 * 60 * 1000;

    await student.save({ validateBeforeSave: false });

    // In production, send email with reset token
    // For now, we'll just return success
    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to email',
      resetToken // Remove this in production
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Get hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    const student = await Student.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Set new password
    student.password = password;
    student.resetPasswordToken = undefined;
    student.resetPasswordExpires = undefined;

    await student.save();

    // Generate token
    const token = generateToken(student._id);

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    };

    res.status(200)
       .cookie('token', token, cookieOptions)
       .json({
         success: true,
         message: 'Password reset successful',
         data: {
           student,
           token
         }
       });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
  logoutStudent,
  getCurrentStudent,
  forgotPassword,
  resetPassword
};