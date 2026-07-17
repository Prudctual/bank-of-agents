// ============================================
// Header Component
// الشريط العلوي
// ============================================

import { Search, Plus, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { NotificationsBell } from '../NotificationsBell';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user, logout } = useAuthStore();

  return (
    <header className="header">
      <div className="header-title-section">
        <h1 className="header-title">{title}</h1>
        {subtitle && <p className="header-subtitle">{subtitle}</p>}
      </div>

      <div className="header-actions">
        {/* Search */}
        <div className="header-search">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="بحث..." 
            className="search-input"
          />
        </div>

        {/* Notifications */}
        {/* Notifications */}
        <NotificationsBell />

        {/* Add New */}
        <button className="btn btn-primary">
          <Plus size={18} />
          <span>إضافة وكيل</span>
        </button>

        {/* User Menu */}
        <div className="user-menu">
          <div className="user-info">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <span className="user-name">{user?.name}</span>
          </div>
          <button 
            className="header-btn logout-btn" 
            onClick={logout}
            title="تسجيل الخروج"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
