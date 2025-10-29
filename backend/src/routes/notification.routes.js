import express from 'express';
import {
  sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes
router.post('/send', sendNotification);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;

