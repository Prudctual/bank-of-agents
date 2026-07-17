// ============================================
// Wallet Page
// صفحة المحفظة الرئيسية
// ============================================

import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Send,
  Download,
  CreditCard,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import './Wallet.css';

export function Wallet() {
  const { stats, agents, transactions } = useAppStore();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate total balance including agents
  const totalAgentBalance = agents.reduce((sum, a) => sum + a.wallet.balance, 0);
  const mainAccountBalance = 1250.00; // Mock main account balance
  const totalBalance = mainAccountBalance + totalAgentBalance;

  return (
    <div className="wallet-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">المحفظة</h1>
          <p className="page-description">
            إدارة رصيدك المالي وتوزيعه على الوكلاء
          </p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="balance-section">
        <div className="main-balance-card">
          <div className="balance-header">
            <div className="balance-icon">
              <WalletIcon size={28} />
            </div>
            <div className="balance-badge">
              <Shield size={14} />
              <span>آمن</span>
            </div>
          </div>
          <div className="balance-content">
            <span className="balance-label">الرصيد الإجمالي</span>
            <span className="balance-value">{formatCurrency(totalBalance)}</span>
            <div className="balance-breakdown">
              <span>الحساب الرئيسي: {formatCurrency(mainAccountBalance)}</span>
              <span>محافظ الوكلاء: {formatCurrency(totalAgentBalance)}</span>
            </div>
          </div>
          <div className="balance-actions">
            <button className="balance-action-btn primary">
              <Plus size={18} />
              <span>إيداع</span>
            </button>
            <button className="balance-action-btn">
              <Send size={18} />
              <span>تحويل</span>
            </button>
            <button className="balance-action-btn">
              <Download size={18} />
              <span>سحب</span>
            </button>
          </div>
        </div>

        <div className="stats-cards">
          <div className="wallet-stat-card">
            <div className="wallet-stat-icon incoming">
              <ArrowDownRight size={20} />
            </div>
            <div className="wallet-stat-content">
              <span className="wallet-stat-label">الإيداعات هذا الشهر</span>
              <span className="wallet-stat-value incoming">+{formatCurrency(1500)}</span>
            </div>
          </div>
          <div className="wallet-stat-card">
            <div className="wallet-stat-icon outgoing">
              <ArrowUpRight size={20} />
            </div>
            <div className="wallet-stat-content">
              <span className="wallet-stat-label">المصروفات هذا الشهر</span>
              <span className="wallet-stat-value outgoing">-{formatCurrency(stats.monthlySpending)}</span>
            </div>
          </div>
          <div className="wallet-stat-card">
            <div className="wallet-stat-icon trend">
              <TrendingUp size={20} />
            </div>
            <div className="wallet-stat-content">
              <span className="wallet-stat-label">صافي التغيير</span>
              <span className="wallet-stat-value trend">+{formatCurrency(1500 - stats.monthlySpending)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Wallets */}
      <div className="agent-wallets-section">
        <div className="section-header">
          <h2 className="section-title">محافظ الوكلاء</h2>
          <button className="btn btn-secondary">
            <Plus size={16} />
            <span>تمويل وكيل</span>
          </button>
        </div>

        <div className="agent-wallets-grid">
          {agents.map((agent) => {
            const spendingPercentage = (agent.wallet.spentToday / agent.wallet.dailyLimit) * 100;
            return (
              <div key={agent.id} className="agent-wallet-card">
                <div className="agent-wallet-header">
                  <div className="agent-wallet-avatar">
                    <WalletIcon size={18} />
                  </div>
                  <div className="agent-wallet-info">
                    <span className="agent-wallet-name">{agent.name}</span>
                    <span className={`agent-wallet-status status-${agent.status}`}>
                      {agent.status === 'active' ? 'نشط' : 'متوقف'}
                    </span>
                  </div>
                </div>

                <div className="agent-wallet-balance">
                  <span className="agent-wallet-balance-value">{formatCurrency(agent.wallet.balance)}</span>
                  <span className="agent-wallet-balance-label">الرصيد المتاح</span>
                </div>

                <div className="agent-wallet-limits">
                  <div className="limit-header">
                    <span className="limit-label">الحد اليومي</span>
                    <span className="limit-value">
                      {formatCurrency(agent.wallet.spentToday)} / {formatCurrency(agent.wallet.dailyLimit)}
                    </span>
                  </div>
                  <div className="limit-bar">
                    <div 
                      className="limit-fill"
                      style={{ 
                        width: `${Math.min(spendingPercentage, 100)}%`,
                        background: spendingPercentage > 80 ? 'var(--color-error)' : 
                                   spendingPercentage > 50 ? 'var(--color-warning)' : 
                                   'var(--gradient-success)'
                      }}
                    />
                  </div>
                </div>

                <div className="agent-wallet-actions">
                  <button className="btn btn-ghost btn-sm">تمويل</button>
                  <button className="btn btn-ghost btn-sm">سحب</button>
                  <button className="btn btn-ghost btn-sm">التفاصيل</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2 className="section-title">إجراءات سريعة</h2>
        </div>

        <div className="quick-actions-grid">
          <div className="quick-action-card">
            <div className="quick-action-icon">
              <CreditCard size={24} />
            </div>
            <h3 className="quick-action-title">ربط بطاقة</h3>
            <p className="quick-action-desc">اربط بطاقتك للإيداع التلقائي</p>
          </div>
          <div className="quick-action-card">
            <div className="quick-action-icon">
              <Send size={24} />
            </div>
            <h3 className="quick-action-title">التوزيع التلقائي</h3>
            <p className="quick-action-desc">وزع الرصيد على الوكلاء تلقائياً</p>
          </div>
          <div className="quick-action-card">
            <div className="quick-action-icon">
              <Shield size={24} />
            </div>
            <h3 className="quick-action-title">إعدادات الأمان</h3>
            <p className="quick-action-desc">إدارة حدود الصرف والموافقات</p>
          </div>
        </div>
      </div>
    </div>
  );
}
