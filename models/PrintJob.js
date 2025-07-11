// backend/models/PrintJob.js
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2'); // ✅ Add this at the top

const printJobSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      return `SREC${Date.now()}`;
    }
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required']
  },
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  originalFileName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  filePath: {
    type: String,
    required: [true, 'File path is required']
  },
  totalPages: {
    type: Number,
    required: [true, 'Total pages is required'],
    min: [1, 'Total pages must be at least 1']
  },
  numCopies: {
    type: Number,
    required: [true, 'Number of copies is required'],
    min: [1, 'Number of copies must be at least 1'],
    max: [100, 'Number of copies cannot exceed 100']
  },
  printingType: {
    type: String,
    required: [true, 'Printing type is required'],
    enum: ['bw', 'colour', 'mixed', 'poster']
  },
  printingSide: {
    type: String,
    required: [true, 'Printing side is required'],
    enum: ['single', 'double']
  },
  finishingOption: {
    type: String,
    required: [true, 'Finishing option is required'],
    enum: ['none', 'spiral', 'caligo', 'stickfile']
  },
  colorPages: {
    type: String,
    default: '',
    validate: {
      validator: function(value) {
        if (this.printingType === 'mixed') {
          return value && value.trim().length > 0;
        }
        return true;
      },
      message: 'Color pages must be specified for mixed printing'
    }
  },
  specialInstructions: {
    type: String,
    default: '',
    maxlength: [500, 'Special instructions cannot exceed 500 characters']
  },
  totalCost: {
    type: Number,
    required: [true, 'Total cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Indexes for performance
printJobSchema.index({ student: 1, createdAt: -1 });
printJobSchema.index({ orderId: 1 });
printJobSchema.index({ status: 1 });

// Pre-save hook for cost calculation
printJobSchema.pre('save', function(next) {
  if (this.isModified('totalPages') || this.isModified('numCopies') || 
      this.isModified('printingType') || this.isModified('printingSide') || 
      this.isModified('finishingOption') || this.isModified('colorPages')) {
    this.totalCost = this.calculateCost();
  }
  next();
});

// Cost calculation method
printJobSchema.methods.calculateCost = function() {
  let costPerPage = 0;
  let adjustedPages = this.totalPages;
  let colorPageCount = 0;
  let bwPageCount = this.totalPages;

  if (this.colorPages && this.colorPages.trim() && this.printingType === 'mixed') {
    const colorPageNumbers = this.parsePageNumbers(this.colorPages);
    colorPageCount = colorPageNumbers.length;
    bwPageCount = this.totalPages - colorPageCount;
  }

  if (this.printingType === 'bw') {
    costPerPage = 1;
  } else if (this.printingType === 'colour') {
    costPerPage = 10;
  } else if (this.printingType === 'poster') {
    costPerPage = 50;
  } else if (this.printingType === 'mixed') {
    costPerPage = 0; // calculated separately
  }

  if (this.printingSide === 'double') {
    adjustedPages = Math.ceil(this.totalPages / 2);
  }

  let cost = 0;
  if (this.printingType === 'mixed') {
    if (this.printingSide === 'double') {
      cost = (Math.ceil(bwPageCount / 2) * 1 + Math.ceil(colorPageCount / 2) * 10) * this.numCopies;
    } else {
      cost = (bwPageCount * 1 + colorPageCount * 10) * this.numCopies;
    }
  } else {
    cost = adjustedPages * costPerPage * this.numCopies;
  }

  if (this.finishingOption === 'spiral') cost += 40;
  else if (this.finishingOption === 'caligo') cost += 60;
  else if (this.finishingOption === 'stickfile') cost += 15;

  return parseFloat(cost.toFixed(2));
};

// Page number parser
printJobSchema.methods.parsePageNumbers = function(pageString) {
  const pages = [];
  const parts = pageString.split(',');

  parts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n.trim()));
      if (start && end && start <= end) {
        for (let i = start; i <= end; i++) {
          if (i <= this.totalPages) pages.push(i);
        }
      }
    } else {
      const pageNum = parseInt(part);
      if (pageNum && pageNum <= this.totalPages) pages.push(pageNum);
    }
  });

  return [...new Set(pages)].sort((a, b) => a - b);
};

// ✅ Plugin for pagination
printJobSchema.plugin(mongoosePaginate);

// ✅ Export the model
module.exports = mongoose.model('PrintJob', printJobSchema);
