const Notification = require('../models/notification');
const mongoose = require('mongoose');

// Get all notifications for the current user
const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Find all notifications for this user, sorted by creation date (newest first)
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to the most recent 50 notifications
    
    return res.status(200).json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark a specific notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Find notification and make sure it belongs to the current user
    const notification = await Notification.findOne({ _id: id, userId });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Update the read status
    notification.read = true;
    await notification.save();
    
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );
    
    return res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete a specific notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    // Find and delete notification, ensuring it belongs to the current user
    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Create a new notification (admin-only or system-generated)
const createNotification = async (req, res) => {
  try {
    const { userIds, title, message, type, link } = req.body;
    
    // Check for required fields
    if (!userIds || !Array.isArray(userIds) || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Only allow admins to create notifications for other users
    const isAdmin = req.userRole === 'admin';
    if (!isAdmin && userIds.some(id => id !== req.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create notifications for other users'
      });
    }
    
    // Create notifications for all specified users
    const notifications = [];
    for (const userId of userIds) {
      const notification = await Notification.create({
        userId,
        title,
        message,
        type: type || 'system',
        link: link || null,
        read: false
      });
      notifications.push(notification);
    }
    
    return res.status(201).json({
      success: true,
      message: 'Notifications created successfully',
      notifications
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Helper function to create notifications from other parts of the app
// This is used internally, not as an API endpoint
const createNotificationForUser = async (userId, title, message, type = 'system', link = null) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      link,
      read: false
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification internally:', error);
    return null;
  }
};

// Get the count of unread notifications for a user
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const count = await Notification.countDocuments({ userId, read: false });
    
    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get unread notification count',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  createNotificationForUser,
  getUnreadCount
};