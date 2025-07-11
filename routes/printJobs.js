
const express = require('express');
const path = require('path');
const router = express.Router();
const {
  getMyPrintJobs,
  createPrintJob,
  uploadPDF,
  cancelPrintJob,
  getPrintJob,
  getPrintJobStats,
  downloadPrintJob // ✅ Added download function
} = require('../controllers/printJobController');
const { protect } = require('../middleware/auth');
const { validatePrintJob, handleValidationErrors } = require('../middleware/validation');
const PrintJob = require('../models/PrintJob'); // ✅ Required for viewing file

// Debug logger (optional)
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Stats route (must be before /:id)
router.get('/stats', protect, getPrintJobStats);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Print jobs router is working!',
    timestamp: new Date().toISOString()
  });
});

// 🔍 View PDF route (MUST come before /:id route)
router.get('/:id/view', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const job = await PrintJob.findOne({
      _id: id,
      student: req.student._id // ✅ Added security check
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Print job not found' });
    }

    const filePath = path.join(__dirname, '..', job.filePath);

    return res.sendFile(filePath);
  } catch (err) {
    console.error('Error viewing file:', err);
    return res.status(500).json({ success: false, message: 'Error sending PDF file' });
  }
});

// ✅ Download PDF route (MUST come before /:id route)
router.get('/:id/download', protect, downloadPrintJob);

// Upload & create print job
router.post(
  '/',
  protect,
  uploadPDF,
  validatePrintJob,
  handleValidationErrors,
  createPrintJob
);

// Get all jobs for logged-in student
router.get('/', protect, getMyPrintJobs);

// Get single print job by ID
router.get('/:id', protect, getPrintJob);

// Cancel a print job
router.delete('/:id', protect, cancelPrintJob);

module.exports = router;