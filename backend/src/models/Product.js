import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  stock: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['in-stock', 'low-stock', 'out-of-stock'],
    default: 'in-stock'
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Auto-update status based on stock
productSchema.pre('save', function(next) {
  if (this.stock === 0) {
    this.status = 'out-of-stock';
  } else if (this.stock <= this.lowStockThreshold) {
    this.status = 'low-stock';
  } else {
    this.status = 'in-stock';
  }
  next();
});

export default mongoose.model('Product', productSchema);
