// middleware/uploadMiddleware.js
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/pdfs';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

const uploadPDF = upload.single('file'); // make sure field name is 'file' not 'pdf'

module.exports = { uploadPDF };
