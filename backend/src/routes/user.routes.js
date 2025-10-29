import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get('/', authorize('admin'), getAllUsers);

// Get user by ID
router.get('/:id', getUserById);

// Update user (Admin can update roles)
router.put('/:id', updateUser);

// Delete user (Admin only)
router.delete('/:id', authorize('admin'), deleteUser);

export default router;
