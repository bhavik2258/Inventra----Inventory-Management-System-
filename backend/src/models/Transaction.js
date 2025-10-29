import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product is required']
  },
  type: {
    type: String,
    enum: ['in', 'out'],
    required: [true, 'Transaction type is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  reference: {
    type: String,
    trim: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  previousStock: {
    type: Number,
    required: true
  },
  newStock: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'rejected'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ product: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ performedBy: 1 });

export default mongoose.model('Transaction', transactionSchema);

