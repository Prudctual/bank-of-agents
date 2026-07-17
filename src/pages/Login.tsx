// ============================================
// Login Page
// صفحة تسجيل الدخول
// ============================================

import { useState } from 'react';
import { Landmark, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import './Login.css';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const { login, register, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (isRegister) {
      await register(email, password, name);
    } else {
      await login(email, password);
    }
  };

  const fillDemoCredentials = () => {
    setEmail('demo@bankofagents.com');
    setPassword('demo123');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Landmark size={32} />
            </div>
            <h1 className="login-title">مصرف الوكلاء</h1>
            <p className="login-subtitle">
              {isRegister ? 'إنشاء حساب جديد' : 'تسجيل الدخول إلى حسابك'}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">الاسم</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="اسمك الكامل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">البريد الإلكتروني</label>
              <input
                type="email"
                className="form-input"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            <div className="form-group">
              <label className="form-label">كلمة المرور</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir="ltr"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" style={{ margin: '0 auto' }} />
              ) : isRegister ? (
                'إنشاء حساب'
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>

          <div className="login-divider">أو</div>

          <div className="login-switch">
            <button 
              className="login-switch-button"
              onClick={() => {
                setIsRegister(!isRegister);
                clearError();
              }}
            >
              {isRegister ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </button>
            {isRegister ? 'لديك حساب؟' : 'ليس لديك حساب؟'}
          </div>

          {!isRegister && (
            <div className="demo-credentials">
              <p className="demo-credentials-title">بيانات تجريبية</p>
              <p className="demo-credentials-text">
                البريد: demo@bankofagents.com
                <br />
                كلمة المرور: demo123
              </p>
              <button 
                type="button"
                className="login-switch-button"
                onClick={fillDemoCredentials}
                style={{ marginTop: '8px' }}
              >
                استخدام البيانات التجريبية
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
