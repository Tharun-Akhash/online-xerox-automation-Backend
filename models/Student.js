
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return email.endsWith('@srec.ac.in');
      },
      message: 'Email must end with @srec.ac.in'
    }
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    unique: true,
    validate: {
      validator: function(rollNumber) {
        return /^\d{10}$/.test(rollNumber) && rollNumber.startsWith('7181');
      },
      message: 'Roll number must be 10 digits starting with 7181'
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    validate: {
      validator: function(phoneNumber) {
        return /^\d{10}$/.test(phoneNumber) && /^[6-9]/.test(phoneNumber);
      },
      message: 'Phone number must be 10 digits starting with 6, 7, 8, or 9'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function(password) {
        return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
      },
      message: 'Password must contain uppercase, lowercase, and number'
    }
  },
isVerified: {
  type: Boolean,
  default: false
},
isActive: {
  type: Boolean,
  default: true
},
  verificationToken: {
    type: String
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
studentSchema.methods.toJSON = function() {
  const student = this.toObject();
  delete student.password;
  delete student.verificationToken;
  delete student.resetPasswordToken;
  delete student.resetPasswordExpires;
  return student;
};

module.exports = mongoose.model('Student', studentSchema);