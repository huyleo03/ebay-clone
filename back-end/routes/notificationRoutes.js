const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Get all notifications for the current user
router.get('/', auth, notificationController.getNotifications);

// Mark a specific notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', auth, notificationController.markAllAsRead);

// Delete a specific notification
router.delete('/:id', auth, notificationController.deleteNotification);

// Get count of unread notifications
router.get('/unread-count', auth, notificationController.getUnreadCount);

// Create notification(s) - admin only route
router.post('/', auth, notificationController.createNotification);

// Test route to quickly create a notification for testing
router.post('/test', auth, async (req, res) => {
  try {
    const result = await notificationController.createNotificationForUser(
      req.userId,
      'Test Notification',
      'This is a test notification to verify the system works.',
      'system',
      null
    );
    
    return res.status(201).json({
      success: true,
      message: 'Test notification created successfully',
      notification: result
    });
  } catch (error) {
    console.error('Error creating test notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
});

module.exports = router;