const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define Shopkeeper schema
const shopkeeperSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    unique: true,
    match: [/^\d{10}$/, 'Phone number must be exactly 10 digits']
  },
  ownerName: {
    type: String,
    required: [true, 'Owner name is required'],
    minlength: [2, 'Owner name must be at least 2 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    validate: {
      validator: function (val) {
        return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(val);
      },
      message: 'Password must contain at least 1 uppercase, 1 lowercase letter, and 1 number'
    }
  }
}, {
  timestamps: true
});

// 🔐 Pre-save hook to hash password
shopkeeperSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// 🔑 Method to compare passwords during login
shopkeeperSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 🚫 Hide password when converting to JSON
shopkeeperSchema.methods.toJSON = function () {
  const shopkeeper = this.toObject();
  delete shopkeeper.password;
  return shopkeeper;
};

module.exports = mongoose.model('Shopkeeper', shopkeeperSchema);
