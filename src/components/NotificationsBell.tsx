
// ============================================
// Notification Bell Component
// ============================================

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import './Notifications.css';

// Helper for relative time
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'الآن';
  if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
  if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
  return `منذ ${Math.floor(diffInSeconds / 86400)} يوم`;
};

export function NotificationsBell() {
  const { 
    notifications, 
    unreadNotificationsCount, 
    fetchNotifications, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useDataStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-success" />;
      case 'warning': return <AlertTriangle size={16} className="text-warning" />;
      case 'error': return <XCircle size={16} className="text-error" />;
      default: return <Info size={16} className="text-info" />;
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`notification-btn ${isOpen ? 'active' : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell size={20} />
        {unreadNotificationsCount > 0 && (
          <span className="badge">{unreadNotificationsCount > 99 ? '+99' : unreadNotificationsCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notifications-dropdown">
          <div className="dropdown-header">
            <h3>الإشعارات</h3>
            {unreadNotificationsCount > 0 && (
              <button 
                className="mark-all-btn"
                onClick={() => markAllNotificationsRead()}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="empty-state">
                <Bell size={32} className="text-muted" />
                <p>لا توجد إشعارات جديدة</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => markNotificationRead(notification.id)}
                >
                  <div className={`notification-icon ${notification.type}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="time">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  {!notification.isRead && (
                    <div className="unread-dot" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
