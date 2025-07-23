const mongoose = require('mongoose');

// Use mongoose.models to check if model already exists first
const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['order', 'product', 'system', 'promotion', 'other'],
    default: 'system'
  },
  link: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create index for efficient querying by userId and read status
notificationSchema.index({ userId: 1, read: 1 });

// Check if model exists before creating a new one
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = Notification;