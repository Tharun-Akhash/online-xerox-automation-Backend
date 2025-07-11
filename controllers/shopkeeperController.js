const Shopkeeper = require('../models/Shopkeeper');

// Register Shopkeeper
exports.registerShopkeeper = async (req, res) => {
  try {
    const { email, password, phoneNumber, ownerName } = req.body;

    // Validate required fields
    if (!email || !password || !phoneNumber || !ownerName) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Check if shopkeeper already exists
    const existing = await Shopkeeper.findOne({ 
      $or: [{ email }, { phoneNumber }] 
    });
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Shopkeeper with this email or phone number already exists' 
      });
    }

    // Create new shopkeeper (password will be hashed automatically by pre-save hook)
    const shopkeeper = await Shopkeeper.create({ 
      email, 
      password, 
      phoneNumber, 
      ownerName 
    });

    res.status(201).json({
      success: true,
      message: 'Shopkeeper registered successfully',
      data: {
        id: shopkeeper._id,
        email: shopkeeper.email,
        ownerName: shopkeeper.ownerName,
        phoneNumber: shopkeeper.phoneNumber
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ 
        success: false, 
        message: errors.join(', ') 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

// Login Shopkeeper
exports.loginShopkeeper = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Find shopkeeper by email
    const shopkeeper = await Shopkeeper.findOne({ email });
    if (!shopkeeper) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    // Use the comparePassword method from the model
    const isMatch = await shopkeeper.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: shopkeeper._id,
        email: shopkeeper.email,
        ownerName: shopkeeper.ownerName,
        phoneNumber: shopkeeper.phoneNumber
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};