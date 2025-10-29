import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Audit title is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Audit date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed'],
    default: 'scheduled'
  },
  discrepancies: {
    type: Number,
    default: 0
  },
  discrepancyDetails: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    sku: String,
    currentStock: Number,
    status: String,
    discrepancies: [{
      type: String,
      message: String,
      severity: String
    }]
  }],
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
auditSchema.index({ status: 1, date: -1 });
auditSchema.index({ createdBy: 1 });

export default mongoose.model('Audit', auditSchema);

