const express = require('express');
const router = express.Router();
const {
  registerShopkeeper,
  loginShopkeeper
} = require('../controllers/shopkeeperController');

// @route   POST /api/shopkeeper/register
// @desc    Register a new shopkeeper
// @access  Public
router.post('/register', registerShopkeeper);

// @route   POST /api/shopkeeper/login
// @desc    Login an existing shopkeeper
// @access  Public
router.post('/login', loginShopkeeper);

module.exports = router;
