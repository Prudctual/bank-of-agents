// ============================================
// مصرف الوكلاء - Bank of Agents
// Main Application Entry
// ============================================

import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { useAuthStore } from './stores/authStore';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { Wallet } from './pages/Wallet';
import { Transactions } from './pages/Transactions';
import { Login } from './pages/Login';
import { Approvals } from './pages/Approvals';
import { Audit } from './pages/Audit';
import { Settings } from './pages/Settings';
import './index.css';

// Page configuration
const pageConfig: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة شاملة على نشاط الوكلاء والمعاملات' },
  agents: { title: 'إدارة الوكلاء', subtitle: 'إدارة وكلاء الذكاء الاصطناعي ومحافظهم' },
  wallet: { title: 'المحفظة', subtitle: 'إدارة رصيدك المالي وتوزيعه على الوكلاء' },
  transactions: { title: 'المعاملات', subtitle: 'سجل جميع العمليات المالية' },
  audit: { title: 'سجل التدقيق', subtitle: 'تتبع قرارات الوكلاء وأسبابها' },
  approvals: { title: 'طلبات الموافقة', subtitle: 'مراجعة طلبات الصرف المعلقة' },
  settings: { title: 'الإعدادات', subtitle: 'تخصيص النظام والتفضيلات' },
};

function App() {
  const { currentPage, sidebarOpen } = useAppStore();
  const { isAuthenticated, isLoading, fetchUser, token } = useAuthStore();
  const config = pageConfig[currentPage] || pageConfig.dashboard;

  // Check authentication on mount
  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchUser();
    }
  }, [token, isAuthenticated, fetchUser]);

  // Show loading while checking auth
  if (isLoading && token) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>جاري التحميل...</p>
        </div>
        <style>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--color-bg-primary);
          }
          .loading-content {
            text-align: center;
            color: var(--color-text-muted);
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid var(--color-border);
            border-top-color: var(--color-primary);
            border-radius: 50%;
            margin: 0 auto var(--spacing-md);
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'agents':
        return <Agents />;
      case 'wallet':
        return <Wallet />;
      case 'transactions':
        return <Transactions />;
      case 'audit':
        return <Audit />;
      case 'approvals':
        return <Approvals />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main 
        className="main-content" 
        style={{ marginRight: sidebarOpen ? '280px' : '72px' }}
      >
        <Header title={config.title} subtitle={config.subtitle} />
        {renderPage()}
      </main>
    </div>
  );
}

// Coming Soon Component
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="coming-soon">
      <div className="coming-soon-content">
        <div className="coming-soon-icon">🚧</div>
        <h2 className="coming-soon-title">{title}</h2>
        <p className="coming-soon-text">هذه الميزة قيد التطوير وستكون متاحة قريباً</p>
      </div>
      <style>{`
        .coming-soon {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .coming-soon-content {
          text-align: center;
        }
        .coming-soon-icon {
          font-size: 4rem;
          margin-bottom: var(--spacing-md);
        }
        .coming-soon-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-sm) 0;
        }
        .coming-soon-text {
          color: var(--color-text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
}

export default App;
