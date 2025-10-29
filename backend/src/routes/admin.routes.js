import express from 'express';
import { getDashboardStats, updateUserRole } from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize('admin'));

// Get dashboard stats
router.get('/dashboard', getDashboardStats);

// Update user role
router.put('/users/:id/role', updateUserRole);

export default router;

