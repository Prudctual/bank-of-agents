
// ============================================
// Settings Page
// صفحة الإعدادات
// ============================================

import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Moon, 
  Shield, 
  Smartphone,
  Mail,
  Save,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import './Settings.css';

type Tab = 'general' | 'security' | 'notifications';

export function Settings() {
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [isLoading, setIsLoading] = useState(false);

  // Form States (Mock)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    language: 'ar',
    theme: 'dark',
    emailNotifications: true,
    pushNotifications: false,
    securityAlerts: true,
    twoFactor: false
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    // Ideally show a success toast here
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Sidebar Navigation */}
        <div className="settings-sidebar">
          <div className="user-mini-profile">
            <div className="user-avatar-large">
              {user?.name.charAt(0)}
            </div>
            <div className="user-info">
              <h3>{user?.name}</h3>
              <p>{user?.email}</p>
            </div>
          </div>
          
          <nav className="settings-nav">
            <button 
              className={`nav-item ${activeTab === 'general' ? 'active' : ''}`}
              onClick={() => setActiveTab('general')}
            >
              <User size={18} />
              <span>الملف الشخصي</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={18} />
              <span>الأمان</span>
            </button>
            <button 
              className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={18} />
              <span>الإشعارات</span>
            </button>
          </nav>

          <div className="settings-logout">
            <button className="btn btn-ghost btn-danger full-width" onClick={logout}>
              <LogOut size={18} />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="settings-content">
          <form onSubmit={handleSave}>
            {activeTab === 'general' && (
              <div className="settings-section fade-in">
                <div className="section-header">
                  <h2>الملف الشخصي</h2>
                  <p>تحديث معلوماتك الشخصية وتفضيلات النظام</p>
                </div>
                
                <div className="form-grid">
                  <div className="form-group">
                    <label>الاسم الكامل</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={formData.email}
                      disabled
                    />
                    <span className="helper-text">لا يمكن تغيير البريد الإلكتروني</span>
                  </div>
                  <div className="form-group">
                    <label>اللغة</label>
                    <div className="select-wrapper">
                      <Globe size={16} className="select-icon" />
                      <select 
                        className="form-input pl-10"
                        value={formData.language}
                        onChange={e => setFormData({...formData, language: e.target.value})}
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>المظهر</label>
                    <div className="select-wrapper">
                      <Moon size={16} className="select-icon" />
                      <select 
                        className="form-input pl-10"
                        value={formData.theme}
                        onChange={e => setFormData({...formData, theme: e.target.value})}
                      >
                        <option value="dark">داكن (Dark)</option>
                        <option value="light">فاتح (Light)</option>
                        <option value="system">النظام</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section fade-in">
                <div className="section-header">
                  <h2>الأمان</h2>
                  <p>إدارة كلمة المرور وحماية الحساب</p>
                </div>

                <div className="security-cards">
                  <div className="security-card">
                    <div className="card-icon">
                      <Lock size={24} />
                    </div>
                    <div className="card-info">
                      <h3>كلمة المرور</h3>
                      <p>آخر تغيير منذ 3 أشهر</p>
                    </div>
                    <button type="button" className="btn btn-secondary">تغيير</button>
                  </div>

                  <div className="divider"></div>

                  <div className="form-group toggle-group">
                    <div className="toggle-info">
                      <label>المصادقة الثنائية (2FA)</label>
                      <p>إضافة طبقة أمان إضافية لحسابك</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={formData.twoFactor}
                        onChange={e => setFormData({...formData, twoFactor: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="settings-section fade-in">
                <div className="section-header">
                  <h2>الإشعارات</h2>
                  <p>التحكم في التنبيهات التي تصلك</p>
                </div>

                <div className="notifications-list">
                  <div className="notification-item">
                    <div className="item-icon">
                      <Mail size={20} />
                    </div>
                    <div className="item-content">
                      <h3>بريد إلكتروني</h3>
                      <p>استلام ملخص أسبوعي وعمليات الدفع الكبيرة</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={formData.emailNotifications}
                        onChange={e => setFormData({...formData, emailNotifications: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="item-icon">
                      <Smartphone size={20} />
                    </div>
                    <div className="item-content">
                      <h3>إشعارات الجوال</h3>
                      <p>تنبيهات فورية لطلبات الموافقة</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={formData.pushNotifications}
                        onChange={e => setFormData({...formData, pushNotifications: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="notification-item">
                    <div className="item-icon">
                      <Shield size={20} />
                    </div>
                    <div className="item-content">
                      <h3>تنبيهات الأمان</h3>
                      <p>تسجيل الدخول من أجهزة جديدة</p>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={formData.securityAlerts}
                        onChange={e => setFormData({...formData, securityAlerts: e.target.checked})}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="settings-footer">
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>جاري الحفظ...</>
                ) : (
                  <>
                    <Save size={18} />
                    حفظ التغييرات
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
