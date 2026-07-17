// ============================================
// Sidebar Component
// القائمة الجانبية الرئيسية
// ============================================

import { 
  LayoutDashboard, 
  Bot, 
  Wallet, 
  ArrowLeftRight, 
  FileText, 
  Settings,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import './Sidebar.css';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
  { id: 'agents', label: 'الوكلاء', icon: <Bot size={20} /> },
  { id: 'wallet', label: 'المحفظة', icon: <Wallet size={20} /> },
  { id: 'transactions', label: 'المعاملات', icon: <ArrowLeftRight size={20} /> },
  { id: 'audit', label: 'سجل التدقيق', icon: <FileText size={20} /> },
];

export function Sidebar() {
  const { 
    user, 
    currentPage, 
    setCurrentPage, 
    sidebarOpen, 
    setSidebarOpen,
    notifications,
    stats
  } = useAppStore();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Wallet size={24} />
          </div>
          {sidebarOpen && (
            <div className="logo-text">
              <span className="logo-title">مصرف الوكلاء</span>
              <span className="logo-subtitle">Bank of Agents</span>
            </div>
          )}
        </div>
        <button 
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'طي القائمة' : 'توسيع القائمة'}
        >
          {sidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${currentPage === item.id ? 'nav-item-active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {sidebarOpen && <span className="nav-label">{item.label}</span>}
                {sidebarOpen && item.id === 'agents' && (
                  <span className="nav-badge">{stats.activeAgents}/{stats.totalAgents}</span>
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-divider" />

        <ul className="nav-list">
          <li>
            <button
              className={`nav-item ${currentPage === 'approvals' ? 'nav-item-active' : ''}`}
              onClick={() => setCurrentPage('approvals')}
            >
              <span className="nav-icon"><Bell size={20} /></span>
              {sidebarOpen && <span className="nav-label">الموافقات</span>}
              {stats.pendingApprovals > 0 && (
                <span className="nav-badge nav-badge-warning">
                  {stats.pendingApprovals}
                </span>
              )}
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${currentPage === 'settings' ? 'nav-item-active' : ''}`}
              onClick={() => setCurrentPage('settings')}
            >
              <span className="nav-icon"><Settings size={20} /></span>
              {sidebarOpen && <span className="nav-label">الإعدادات</span>}
            </button>
          </li>
        </ul>
      </nav>

      {/* User Section */}
      <div className="sidebar-footer">
        {user && (
          <div className="user-section">
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            )}
            {sidebarOpen && (
              <button className="btn-icon logout-btn" aria-label="تسجيل الخروج">
                <LogOut size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
