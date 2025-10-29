import express from 'express';
import {
  stockIn,
  stockOut,
  validateStockLevel,
  generateReport,
  getTransactions
} from '../controllers/manager.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// All routes require manager role
router.use(authorize('manager'));

// Stock operations
router.post('/stockIn', stockIn);
router.post('/stockOut', stockOut);

// Stock validation
router.get('/validateStock', validateStockLevel);

// Report generation
router.get('/generateReport', generateReport);

// Transaction history
router.get('/transactions', getTransactions);

export default router;

