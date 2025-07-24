import { useState, useEffect, useRef } from "react";
import { ChevronDown, ShoppingCart, Bell, X, Check, Calendar, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/cartContext";

// API base URL - update this to match your backend
const API_BASE_URL = "http://localhost:9999";

// Format relative time (e.g., "2 hours ago")
const formatRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Vừa xong';
  } else if (diffMins < 60) {
    return `${diffMins} phút trước`;
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
};

export default function TopMenu() {
  const [isMenu, setIsMenu] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState(false);
  const [notifError, setNotifError] = useState(null);
  const { cartCount, updateCartCount } = useCart();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    const token = localStorage.getItem("token");

    if (user && token) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser && typeof parsedUser === 'object') {
          setCurrentUser(parsedUser);
        } else {
          throw new Error("Invalid user data");
        }
      } catch (error) {
        console.error("Failed to parse currentUser from localStorage:", error);
        localStorage.removeItem("currentUser");
        localStorage.removeItem("token");
        setCurrentUser(null);
      }
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("token");
      setCurrentUser(null);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      updateCartCount();
      fetchNotifications();
      
      // Poll for new notifications every minute
      const notifInterval = setInterval(() => {
        fetchNotifications(true); // true = silent refresh (no loading indicator)
      }, 60000);
      
      return () => clearInterval(notifInterval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser, updateCartCount]);

  const fetchNotifications = async (silent = false) => {
    if (!currentUser) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      if (!silent) {
        setIsLoadingNotifs(true);
        setNotifError(null);
      }
      
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          
          // Count unread notifications
          const unread = data.notifications.filter(notification => !notification.read).length;
          setUnreadCount(unread);
        } else {
          console.error("Failed to fetch notifications:", data.message);
          if (!silent) setNotifError("Không thể tải thông báo");
        }
      } else if (response.status === 401) {
        // Token expired, log out user
        handleSignOut();
      } else {
        if (!silent) setNotifError("Không thể tải thông báo");
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      if (!silent) setNotifError("Lỗi kết nối");
    } finally {
      if (!silent) setIsLoadingNotifs(false);
    }
  };

  const markAsRead = async (id) => {
    if (!currentUser) return;
    const token = localStorage.getItem("token");
    
    try {
      // Optimistic UI update
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => 
          notif._id === id ? { ...notif, read: true } : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Revert on error
        fetchNotifications(true);
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
      // Revert on error
      fetchNotifications(true);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    const token = localStorage.getItem("token");
    
    try {
      // Optimistic UI update
      setNotifications(prevNotifications => 
        prevNotifications.map(notif => ({ ...notif, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
      
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        // Revert on error
        fetchNotifications(true);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
      // Revert on error
      fetchNotifications(true);
    }
  };

  const deleteNotification = async (id, event) => {
    if (event) event.stopPropagation(); // Prevent triggering parent click handlers
    if (!currentUser) return;
    const token = localStorage.getItem("token");
    
    try {
      // Optimistic UI update
      const notificationToDelete = notifications.find(notif => notif._id === id);
      const wasUnread = notificationToDelete?.read === false;
      
      setNotifications(prevNotifications => 
        prevNotifications.filter(notif => notif._id !== id)
      );
      
      // Update unread count if needed
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Revert on error
        fetchNotifications(true);
      }
    } catch (error) {
      console.error("Failed to delete notification:", error);
      // Revert on error
      fetchNotifications(true);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
    setCurrentUser(null);
    setIsMenu(false);
    setNotifications([]);
    setUnreadCount(0);
    navigate("/auth");
  };

  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    // If opening notifications and user is logged in, fetch latest
    if (!isNotificationsOpen && currentUser) {
      fetchNotifications();
    }
  };

  // Handle clicking on a notification
  const handleNotificationClick = (notification) => {
    // Mark as read if not already
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // Navigate to the link if one exists
    if (notification.link) {
      setIsNotificationsOpen(false);
      navigate(notification.link);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart size={16} className="text-blue-500" />;
      case 'promotion':
        return <Calendar size={16} className="text-green-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div id="TopMenu" className="border-b">
      <div className="flex items-center justify-between w-full mx-auto max-w-[1200px]">
        <ul className="flex items-center text-[11px] text-[#333333] px-2 h-8">
          <li className="relative px-3">
            {currentUser ? (
              <button
                onClick={() => setIsMenu(!isMenu)}
                className="flex items-center gap-2 hover:underline cursor-pointer"
              >
                <div>Hi, {currentUser.username}</div>
                <ChevronDown size={12} />
              </button>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 hover:underline cursor-pointer"
              >
                <div>Đăng nhập</div>
                <ChevronDown size={12} />
              </Link>
            )}

            {currentUser && isMenu && (
              <div className="absolute bg-white w-[200px] text-[#333333] z-40 top-[20px] left-0 border shadow-lg">
                <div className="flex items-center justify-start gap-1 p-3">
                  <img
                    src="https://picsum.photos/50"
                    alt="User Avatar"
                    className="w-[50px] h-[50px] rounded-full"
                  />
                  <div>
                    <div className="font-bold text-[13px]">
                      {currentUser.username}
                    </div>
                    <Link to={`/profile`}>
                      <div className="text-sm font-semibold border px-1 bg-gray-200 rounded-lg text-blue-500">
                        Account Settings
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="border-b" />
                <ul className="bg-white">
                  <li className="text-[11px] py-2 px-4 hover:underline text-blue-500 hover:text-blue-600 cursor-pointer">
                    <Link to="/order-history">Order History</Link>
                  </li>
                  <li
                    onClick={handleSignOut}
                    className="text-[11px] py-2 px-4 hover:underline text-blue-500 hover:text-blue-600 cursor-pointer"
                  >
                    Logout
                  </li>
                </ul>
              </div>
            )}
          </li>
          <li className="px-3 hover:underline cursor-pointer">
            <Link to="/daily-deals">
            Daily deals</Link>
          </li>
          <li className="px-3 hover:underline cursor-pointer">
            <Link to="/help">Support & Contact</Link>
          </li>
        </ul>

        <ul className="flex items-center text-[11px] text-[#333333] px-2 h-8">
          {currentUser?.role === "admin" && (
            <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
              <Link
                to="/adminDashboard"
                className="flex items-center gap-2 text-blue-400 font-bold"
              >
                Dashboard
              </Link>
            </li>
          )}
          <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
            <Link to="/sell">Sell</Link>
          </li>
          <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
            <Link to="/shipping">
              <img width={32} src="/images/vn.png" alt="Ship to Vietnam" />
              Shipping
            </Link>
          </li>
          <li className="flex items-center gap-2 px-3 hover:underline cursor-pointer">
            <Link to="/wishlist">Wishlist</Link>
          </li>
          
          {/* Notification Button */}
          <li className="px-3 hover:underline cursor-pointer relative">
            <button onClick={toggleNotifications} className="relative">
              <Bell size={22} />
              {unreadCount > 0 && (
                <div className="absolute text-[10px] -top-[2px] -right-[5px] bg-red-500 w-[14px] h-[14px] rounded-full text-white flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </button>
            
            {/* Notification Panel */}
            {isNotificationsOpen && (
              <div 
                ref={notificationRef}
                className="absolute w-[320px] max-h-[400px] overflow-y-auto right-0 top-[30px] bg-white shadow-lg border rounded-md z-50"
              >
                <div className="flex justify-between items-center p-3 border-b sticky top-0 bg-white z-10">
                  <h3 className="font-semibold">Notification</h3>
                  {notifications.length > 0 && currentUser && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-blue-500 hover:text-blue-700"
                    >
                      
Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="p-2">
                  {!currentUser ? (
                    <div className="text-center py-8">
                      <Bell className="mx-auto mb-2 text-gray-400" size={36} />
                      <p className="text-gray-600 mb-4">
                      Sign in to see your notifications</p>
                      <Link 
                        to="/auth" 
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        Login
                      </Link>
                    </div>
                  ) : isLoadingNotifs ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Notification loading...</p>
                    </div>
                  ) : notifError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500 mb-2">{notifError}</p>
                      <button 
                        onClick={() => fetchNotifications()} 
                        className="text-blue-500 hover:underline"
                      >
                        Again
                      </button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">
                      You have no notifications yet.</p>
                    </div>
                  ) : (
                    <div>
                      {notifications.map((notification) => (
                        <div 
                          key={notification._id} 
                          className={`p-3 border-b last:border-b-0 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                          style={notification.link ? {cursor: 'pointer'} : {}}
                        >
                          <div className="flex justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getNotificationIcon(notification.type)}
                                <p className="text-sm font-medium">{notification.title}</p>
                              </div>
                              <p className="text-xs text-gray-500">{notification.message}</p>
                              <div className="flex items-center text-xs text-gray-400 mt-1">
                                <Clock size={12} className="mr-1" />
                                <span>{formatRelativeTime(notification.createdAt)}</span>
                                {notification.link && (
                                  <span className="ml-2 text-blue-500">View detail</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-start space-x-1">
                              {!notification.read && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification._id);
                                  }}
                                  className="p-1 hover:bg-blue-100 rounded"
                                  title="Đánh dấu đã đọc"
                                >
                                  <Check size={14} className="text-blue-500" />
                                </button>
                              )}
                              <button 
                                onClick={(e) => deleteNotification(notification._id, e)}
                                className="p-1 hover:bg-red-100 rounded"
                                title="Xóa thông báo"
                              >
                                <X size={14} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </li>
          
          {/* Cart Button */}
          <li className="px-3 hover:underline cursor-pointer relative">
            <Link to="/cart">
              <ShoppingCart size={22} />
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}