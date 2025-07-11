const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get student from token
      const student = await Student.findById(decoded.id);
      
      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'No student found with this token'
        });
      }

      // // Check if student account is active
      // if (!student.isActive) {
      //   return res.status(401).json({
      //     success: false,
      //     message: 'Student account is deactivated'
      //   });
      // }

      req.student = student;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error in authentication'
    });
  }
};