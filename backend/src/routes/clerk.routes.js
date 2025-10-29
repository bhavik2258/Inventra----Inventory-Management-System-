import express from 'express';
import {
  getLowStockProducts,
  getPendingOrders,
  updateOrderStatus,
  getDashboardStats,
  requestReorder
} from '../controllers/clerk.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// All routes require clerk role
router.use(authorize('clerk'));

// Dashboard statistics
router.get('/stats', getDashboardStats);

// Low stock products
router.get('/lowStock', getLowStockProducts);

// Request reorder
router.post('/reorder', requestReorder);

// Orders
router.get('/orders', getPendingOrders);

// Update order status
router.put('/orders/:id/status', updateOrderStatus);

export default router;
