import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts
} from '../controllers/product.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all products
router.get('/', getAllProducts);

// Get low stock products
router.get('/low-stock', getLowStockProducts);

// Get product by ID
router.get('/:id', getProductById);

// Create product (Admin, Manager only)
router.post('/', authorize('admin', 'manager'), createProduct);

// Update product (Admin, Manager only)
router.put('/:id', authorize('admin', 'manager'), updateProduct);

// Delete product (Admin only)
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
