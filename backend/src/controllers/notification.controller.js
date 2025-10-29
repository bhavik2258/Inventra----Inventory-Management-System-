import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Product from '../models/Product.js';

/**
 * Notification Service Class
 */
class Notification_Service {
  /**
   * Send a notification to a user
   * @param {string} recipientId - ID of the user to receive the notification
   * @param {string} message - The notification message
   * @param {string} type - Type of notification (reorder, restock, audit, system)
   * @param {string} senderId - ID of the user sending the notification (optional)
   * @param {string} productId - ID of related product (optional)
   * @param {Object} metadata - Additional metadata (optional)
   */
  async sendNotification(recipientId, message, type = 'system', senderId = null, productId = null, metadata = {}) {
    try {
      const notification = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        message,
        type,
        relatedProduct: productId,
        metadata
      });

      // Log the notification
      this.logNotification(notification._id, message, type);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Log a notification (for debugging/monitoring)
   * @param {string} notificationId - ID of the notification
   * @param {string} message - The notification message
   * @param {string} type - Type of notification
   */
  logNotification(notificationId, message, type) {
    console.log(`[Notification ${notificationId}] [${type.toUpperCase()}] ${message}`);
  }

  /**
   * Get notifications for a user
   * @param {string} recipientId - ID of the user
   * @param {Object} filters - Filters (isRead, type, limit)
   */
  async getNotifications(recipientId, filters = {}) {
    try {
      const query = {};
      
      // Handle hardcoded admin user
      if (recipientId === 'admin-hardcoded') {
        // Admin can see all notifications
        query.recipient = { $exists: true };
      } else {
        query.recipient = recipientId;
      }
      
      if (filters.isRead !== undefined) {
        query.isRead = filters.isRead;
      }
      
      if (filters.type) {
        query.type = filters.type;
      }

      const limit = filters.limit || 50;

      const notifications = await Notification.find(query)
        .populate('sender', 'fullName email role')
        .populate('relatedProduct', 'name sku')
        .sort({ createdAt: -1 })
        .limit(limit);

      return notifications;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - ID of the notification
   */
  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} recipientId - ID of the user
   */
  async markAllAsRead(recipientId) {
    try {
      const query = { isRead: false };
      
      // Handle hardcoded admin user
      if (recipientId === 'admin-hardcoded') {
        // Admin can mark all notifications as read
        query.recipient = { $exists: true };
      } else {
        query.recipient = recipientId;
      }
      
      const result = await Notification.updateMany(
        query,
        { isRead: true }
      );

      return result;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} recipientId - ID of the user
   */
  async getUnreadCount(recipientId) {
    try {
      const query = { isRead: false };
      
      // Handle hardcoded admin user
      if (recipientId === 'admin-hardcoded') {
        // Admin can see all unread notifications
        query.recipient = { $exists: true };
      } else {
        query.recipient = recipientId;
      }
      
      const count = await Notification.countDocuments(query);

      return count;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }
}

// Create instance of Notification Service
const notificationService = new Notification_Service();

/**
 * Send a notification
 * @route POST /api/notifications/send
 * @access Private
 */
export const sendNotification = async (req, res) => {
  try {
    const { recipientId, message, type, productId, metadata } = req.body;
    const senderId = req.user?.userId;

    if (!recipientId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Recipient ID and message are required'
      });
    }

    const notification = await notificationService.sendNotification(
      recipientId,
      message,
      type || 'system',
      senderId,
      productId,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send notification'
    });
  }
};

/**
 * Get notifications for the current user
 * @route GET /api/notifications
 * @access Private
 */
export const getNotifications = async (req, res) => {
  try {
    const recipientId = req.user?.userId;
    const { isRead, type, limit } = req.query;

    const filters = {};
    if (isRead !== undefined) filters.isRead = isRead === 'true';
    if (type) filters.type = type;
    if (limit) filters.limit = parseInt(limit);

    const notifications = await notificationService.getNotifications(recipientId, filters);
    const unreadCount = await notificationService.getUnreadCount(recipientId);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get notifications'
    });
  }
};

/**
 * Mark a notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const recipientId = req.user?.userId;

    // Verify the notification belongs to the user
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    // Allow admins to mark any notification as read
    if (recipientId !== 'admin-hardcoded' && notification.recipient.toString() !== recipientId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to mark this notification as read'
      });
    }

    const updated = await notificationService.markAsRead(id);

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read for the current user
 * @route PUT /api/notifications/read-all
 * @access Private
 */
export const markAllAsRead = async (req, res) => {
  try {
    const recipientId = req.user?.userId;

    const result = await notificationService.markAllAsRead(recipientId);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 * @access Private
 */
export const getUnreadCount = async (req, res) => {
  try {
    const recipientId = req.user?.userId;

    const count = await notificationService.getUnreadCount(recipientId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get unread count'
    });
  }
};

export { notificationService };

