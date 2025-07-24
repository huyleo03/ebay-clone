const notificationController = require('../controller/notificationController');

// Create an order notification
const createOrderNotification = async (userId, orderId, status) => {
  try {
    let title, message;
    
    switch (status) {
      case 'created':
        title = 'Đơn hàng đã đặt thành công';
        message = `Đơn hàng #${orderId} của bạn đã được tạo. Chúng tôi đang xử lý.`;
        break;
      case 'processing':
        title = 'Đơn hàng đang được xử lý';
        message = `Đơn hàng #${orderId} của bạn đang được chuẩn bị.`;
        break;
      case 'shipped':
        title = 'Đơn hàng đã được giao cho đơn vị vận chuyển';
        message = `Đơn hàng #${orderId} đã được giao cho đơn vị vận chuyển.`;
        break;
      case 'delivered':
        title = 'Đơn hàng đã giao thành công';
        message = `Đơn hàng #${orderId} đã được giao thành công.`;
        break;
      case 'cancelled':
        title = 'Đơn hàng đã bị hủy';
        message = `Đơn hàng #${orderId} đã bị hủy.`;
        break;
      default:
        title = 'Cập nhật đơn hàng';
        message = `Trạng thái đơn hàng #${orderId} đã được cập nhật: ${status}`;
    }
    
    return await notificationController.createNotificationForUser(
      userId,
      title,
      message,
      'order',
      `/order-detail/${orderId}`
    );
  } catch (error) {
    console.error('Error creating order notification:', error);
    return null;
  }
};

// Create a promotion notification
const createPromotionNotification = async (userId, promotionTitle, discountPercent) => {
  try {
    const title = 'Ưu đãi mới dành cho bạn';
    const message = `${promotionTitle}: Giảm ${discountPercent}% cho đơn hàng tiếp theo của bạn.`;
    
    return await notificationController.createNotificationForUser(
      userId,
      title,
      message,
      'promotion',
      '/promotions'
    );
  } catch (error) {
    console.error('Error creating promotion notification:', error);
    return null;
  }
};

// Create a system notification
const createSystemNotification = async (userId, title, message, link = null) => {
  try {
    return await notificationController.createNotificationForUser(
      userId,
      title,
      message,
      'system',
      link
    );
  } catch (error) {
    console.error('Error creating system notification:', error);
    return null;
  }
};

module.exports = {
  createOrderNotification,
  createPromotionNotification,
  createSystemNotification
};