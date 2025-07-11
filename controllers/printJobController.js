// // backend/controllers/printJobController.js
// const PrintJob = require('../models/PrintJob');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs').promises;

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: async (req, file, cb) => {
//     const uploadDir = 'uploads/pdfs';
//     try {
//       await fs.mkdir(uploadDir, { recursive: true });
//       cb(null, uploadDir);
//     } catch (error) {
//       cb(error);
//     }
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, `${uniqueSuffix}-${file.originalname}`);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (file.mimetype === 'application/pdf') {
//     cb(null, true);
//   } else {
//     cb(new Error('Only PDF files are allowed'), false);
//   }
// };

// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: {
//     fileSize: 50 * 1024 * 1024, // 50MB limit
//   }
// });

// // FIXED: Changed from 'pdf' to 'file' to match frontend
// const uploadPDF = upload.single('file');

// // Create print job
// const createPrintJob = async (req, res) => {
//   try {
//     console.log('=== CREATE PRINT JOB DEBUG ===');
//     console.log('req.student:', req.student);
//     console.log('req.file:', req.file);
//     console.log('req.body:', req.body);
    
//     if (!req.file) {
//       return res.status(400).json({
//         success: false,
//         message: 'PDF file is required'
//       });
//     }

//     const {
//       totalPages,
//       numCopies,
//       printingType,
//       printingSide,
//       finishingOption,
//       colorPages,
//       specialInstructions
//     } = req.body;

//     // Validate required fields
//     if (!totalPages || !numCopies || !printingType || !printingSide || !finishingOption) {
//       // Clean up uploaded file
//       await fs.unlink(req.file.path).catch(console.error);
//       return res.status(400).json({
//         success: false,
//         message: 'Missing required fields'
//       });
//     }

//     // Create print job
//     const printJob = new PrintJob({
//       student: req.student._id,
//       fileName: req.file.filename,
//       originalFileName: req.file.originalname,
//       fileSize: req.file.size,
//       filePath: req.file.path,
//       totalPages: parseInt(totalPages),
//       numCopies: parseInt(numCopies),
//       printingType,
//       printingSide,
//       finishingOption,
//       colorPages: colorPages || '',
//       specialInstructions: specialInstructions || '',
//       totalCost: 0 // Will be calculated by pre-save hook
//     });

//     await printJob.save();

//     // Populate student data for response
//     await printJob.populate('student', 'email rollNumber');

//     res.status(201).json({
//       success: true,
//       message: 'Print job created successfully',
//       data: {
//         printJob
//       }
//     });

//   } catch (error) {
//     console.error('Create print job error:', error);

//     // Clean up uploaded file if exists
//     if (req.file) {
//       await fs.unlink(req.file.path).catch(console.error);
//     }

//     // Handle validation errors
//     if (error.name === 'ValidationError') {
//       console.log('Validation Error Details:', error.errors);
//       const errors = {};
//       Object.keys(error.errors).forEach(key => {
//         errors[key] = error.errors[key].message;
//       });

//       return res.status(400).json({
//         success: false,
//         message: 'Validation failed',
//         errors
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get student's print jobs
// const getMyPrintJobs = async (req, res) => {
//   try {
//     console.log("Fetching jobs for student:", req.student?._id);
//     const { page = 1, limit = 10, status } = req.query;
    
//     const query = { student: req.student._id };
//     if (status) {
//       query.status = status;
//     }

//     const options = {
//       page: parseInt(page),
//       limit: parseInt(limit),
//       sort: { createdAt: -1 },
//       populate: {
//         path: 'student',
//         select: 'email rollNumber'
//       }
//     };

//     const printJobs = await PrintJob.paginate(query, options);

//     res.status(200).json({
//       success: true,
//       data: printJobs
//     });
//   } catch (error) {
//     console.error('Get print jobs error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get specific print job
// const getPrintJob = async (req, res) => {
//   try {
//     const printJob = await PrintJob.findOne({
//       _id: req.params.id,
//       student: req.student._id
//     }).populate('student', 'email rollNumber');

//     if (!printJob) {
//       return res.status(404).json({
//         success: false,
//         message: 'Print job not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: {
//         printJob
//       }
//     });
//   } catch (error) {
//     console.error('Get print job error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Cancel print job
// const cancelPrintJob = async (req, res) => {
//   try {
//     const printJob = await PrintJob.findOne({
//       _id: req.params.id,
//       student: req.student._id
//     });

//     if (!printJob) {
//       return res.status(404).json({
//         success: false,
//         message: 'Print job not found'
//       });
//     }

//     if (printJob.status === 'completed') {
//       return res.status(400).json({
//         success: false,
//         message: 'Cannot cancel completed print job'
//       });
//     }

//     if (printJob.status === 'cancelled') {
//       return res.status(400).json({
//         success: false,
//         message: 'Print job is already cancelled'
//       });
//     }

//     printJob.status = 'cancelled';
//     await printJob.save();

//     res.status(200).json({
//       success: true,
//       message: 'Print job cancelled successfully',
//       data: {
//         printJob
//       }
//     });
//   } catch (error) {
//     console.error('Cancel print job error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// // Get print job statistics
// const getPrintJobStats = async (req, res) => {
//   try {
//     const stats = await PrintJob.aggregate([
//       {
//         $match: { student: req.student._id }
//       },
//       {
//         $group: {
//           _id: '$status',
//           count: { $sum: 1 },
//           totalCost: { $sum: '$totalCost' }
//         }
//       }
//     ]);

//     const totalJobs = await PrintJob.countDocuments({ student: req.student._id });
//     const totalSpent = await PrintJob.aggregate([
//       {
//         $match: { 
//           student: req.student._id,
//           status: { $in: ['completed', 'ready'] }
//         }
//       },
//       {
//         $group: {
//           _id: null,
//           total: { $sum: '$totalCost' }
//         }
//       }
//     ]);

//     res.status(200).json({
//       success: true,
//       data: {
//         stats,
//         totalJobs,
//         totalSpent: totalSpent[0]?.total || 0
//       }
//     });
//   } catch (error) {
//     console.error('Get print job stats error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Internal server error'
//     });
//   }
// };

// module.exports = {
//   uploadPDF, // Export the upload middleware
//   createPrintJob,
//   getMyPrintJobs,
//   getPrintJob,
//   cancelPrintJob,
//   getPrintJobStats
// };
// backend/controllers/printJobController.js
const PrintJob = require('../models/PrintJob');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
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
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// FIXED: Changed from 'pdf' to 'file' to match frontend
const uploadPDF = upload.single('file');

// Create print job
const createPrintJob = async (req, res) => {
  try {
    console.log('=== CREATE PRINT JOB DEBUG ===');
    console.log('req.student:', req.student);
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'PDF file is required'
      });
    }

    const {
      totalPages,
      numCopies,
      printingType,
      printingSide,
      finishingOption,
      colorPages,
      specialInstructions
    } = req.body;

    // Validate required fields
    if (!totalPages || !numCopies || !printingType || !printingSide || !finishingOption) {
      // Clean up uploaded file
      await fs.unlink(req.file.path).catch(console.error);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create print job
    const printJob = new PrintJob({
      student: req.student._id,
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      filePath: req.file.path,
      totalPages: parseInt(totalPages),
      numCopies: parseInt(numCopies),
      printingType,
      printingSide,
      finishingOption,
      colorPages: colorPages || '',
      specialInstructions: specialInstructions || '',
      totalCost: 0 // Will be calculated by pre-save hook
    });

    await printJob.save();

    // Populate student data for response
    await printJob.populate('student', 'email rollNumber phoneNumber');

    // ✅ Flatten student data for easier frontend access
    const jobResponse = printJob.toObject();
    if (printJob.student) {
      jobResponse.email = printJob.student.email;
      jobResponse.rollNumber = printJob.student.rollNumber;
      jobResponse.phoneNumber = printJob.student.phoneNumber;
    }

    res.status(201).json({
      success: true,
      message: 'Print job created successfully',
      data: {
        printJob: jobResponse
      }
    });

  } catch (error) {
    console.error('Create print job error:', error);

    // Clean up uploaded file if exists
    if (req.file) {
      await fs.unlink(req.file.path).catch(console.error);
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.log('Validation Error Details:', error.errors);
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

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ✅ UPDATED: Get student's print jobs with proper student data
const getMyPrintJobs = async (req, res) => {
  try {
    console.log("Fetching jobs for student:", req.student?._id);
    const { page = 1, limit = 10, status } = req.query;
    
    const query = { student: req.student._id };
    if (status) {
      query.status = status;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'student',
        select: 'email rollNumber phoneNumber' // ✅ Added phoneNumber
      }
    };

    const printJobs = await PrintJob.paginate(query, options);

    // ✅ Flatten student details into each print job for easier frontend access
    if (printJobs.docs) {
      printJobs.docs = printJobs.docs.map(job => {
        const jobObj = job.toObject();
        if (job.student) {
          jobObj.email = job.student.email;
          jobObj.rollNumber = job.student.rollNumber;
          jobObj.phoneNumber = job.student.phoneNumber;
        }
        return jobObj;
      });
    }

    res.status(200).json({
      success: true,
      data: printJobs
    });
  } catch (error) {
    console.error('Get print jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ✅ UPDATED: Get specific print job with proper student data
const getPrintJob = async (req, res) => {
  try {
    const printJob = await PrintJob.findOne({
      _id: req.params.id,
      student: req.student._id
    }).populate('student', 'email rollNumber phoneNumber'); // ✅ Added phoneNumber

    if (!printJob) {
      return res.status(404).json({
        success: false,
        message: 'Print job not found'
      });
    }

    // ✅ Flatten student details for easier frontend access
    const jobObj = printJob.toObject();
    if (printJob.student) {
      jobObj.email = printJob.student.email;
      jobObj.rollNumber = printJob.student.rollNumber;
      jobObj.phoneNumber = printJob.student.phoneNumber;
    }

    res.status(200).json({
      success: true,
      data: {
        printJob: jobObj
      }
    });
  } catch (error) {
    console.error('Get print job error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Cancel print job
const cancelPrintJob = async (req, res) => {
  try {
    const printJob = await PrintJob.findOne({
      _id: req.params.id,
      student: req.student._id
    });

    if (!printJob) {
      return res.status(404).json({
        success: false,
        message: 'Print job not found'
      });
    }

    if (printJob.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed print job'
      });
    }

    if (printJob.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Print job is already cancelled'
      });
    }

    printJob.status = 'cancelled';
    await printJob.save();

    res.status(200).json({
      success: true,
      message: 'Print job cancelled successfully',
      data: {
        printJob
      }
    });
  } catch (error) {
    console.error('Cancel print job error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get print job statistics
const getPrintJobStats = async (req, res) => {
  try {
    const stats = await PrintJob.aggregate([
      {
        $match: { student: req.student._id }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$totalCost' }
        }
      }
    ]);

    const totalJobs = await PrintJob.countDocuments({ student: req.student._id });
    const totalSpent = await PrintJob.aggregate([
      {
        $match: { 
          student: req.student._id,
          status: { $in: ['completed', 'ready'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalCost' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats,
        totalJobs,
        totalSpent: totalSpent[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get print job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// ✅ NEW: Download PDF function (if you need it)
const downloadPrintJob = async (req, res) => {
  try {
    const printJob = await PrintJob.findOne({
      _id: req.params.id,
      student: req.student._id
    });

    if (!printJob) {
      return res.status(404).json({
        success: false,
        message: 'Print job not found'
      });
    }

    const filePath = path.resolve(printJob.filePath);
    
    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${printJob.originalFileName}"`);
    res.setHeader('Content-Type', 'application/pdf');

    // Send file
    res.sendFile(filePath);

  } catch (error) {
    console.error('Download print job error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  uploadPDF, // Export the upload middleware
  createPrintJob,
  getMyPrintJobs,
  getPrintJob,
  cancelPrintJob,
  getPrintJobStats,
  downloadPrintJob // ✅ Added download function
};