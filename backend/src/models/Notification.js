import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['reorder', 'restock', 'audit', 'system'],
    default: 'system'
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);

