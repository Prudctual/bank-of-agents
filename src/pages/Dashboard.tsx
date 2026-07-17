// ============================================
// Dashboard Page
// صفحة لوحة التحكم الرئيسية
// ============================================

import { useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Bot, 
  Wallet, 
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { useAuthStore } from '../stores/authStore';
import './Dashboard.css';

export function Dashboard() {
  const { 
    agents, 
    transactions, 
    approvalRequests, 
    walletSummary, 
    stats,
    isLoadingAgents,
    isLoadingTransactions,
    isLoadingWallet,
    fetchAll 
  } = useDataStore();

  const { wallet } = useAuthStore();

  // Fetch data on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isLoading = isLoadingAgents || isLoadingTransactions || isLoadingWallet;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return `منذ ${days} يوم`;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'pending_approval':
        return <Clock size={16} className="status-icon warning" />;
      case 'failed':
        return <XCircle size={16} className="status-icon error" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  // Calculate stats from data
  const totalBalance = walletSummary?.totalBalance ?? wallet?.balance ?? 0;
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const todaySpending = stats?.todaySpending ?? 0;
  const pendingApprovals = approvalRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="dashboard">
      {/* Refresh Button */}
      <button 
        className="refresh-btn" 
        onClick={() => fetchAll()}
        disabled={isLoading}
      >
        <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
        {isLoading ? 'جاري التحميل...' : 'تحديث'}
      </button>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="card stat-card-large animate-fade-in" style={{ animationDelay: '0s' }}>
          <div className="stat-header">
            <div className="stat-icon-wrapper gradient-primary">
              <Wallet size={24} />
            </div>
            <span className="stat-change positive">
              <TrendingUp size={14} />
              +12.5%
            </span>
          </div>
          <div className="stat-body">
            <span className="stat-value-large">{formatCurrency(totalBalance)}</span>
            <span className="stat-label">إجمالي الرصيد</span>
          </div>
        </div>

        <div className="card stat-card-large animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-header">
            <div className="stat-icon-wrapper gradient-gold">
              <Bot size={24} />
            </div>
            <span className="stat-badge">{activeAgents} نشط</span>
          </div>
          <div className="stat-body">
            <span className="stat-value-large">{totalAgents}</span>
            <span className="stat-label">إجمالي الوكلاء</span>
          </div>
        </div>

        <div className="card stat-card-large animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-header">
            <div className="stat-icon-wrapper gradient-success">
              <ArrowDownRight size={24} />
            </div>
            <span className="stat-change negative">
              <TrendingDown size={14} />
              -8.2%
            </span>
          </div>
          <div className="stat-body">
            <span className="stat-value-large">{formatCurrency(todaySpending)}</span>
            <span className="stat-label">إنفاق اليوم</span>
          </div>
        </div>

        <div className="card stat-card-large animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-header">
            <div className="stat-icon-wrapper gradient-warning">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="stat-body">
            <span className="stat-value-large">{pendingApprovals}</span>
            <span className="stat-label">موافقات معلقة</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-grid">
        {/* Agents Overview */}
        <div className="card agents-overview animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="card-header">
            <h3 className="card-title">نظرة على الوكلاء</h3>
            <button className="btn btn-ghost">عرض الكل</button>
          </div>
          {isLoadingAgents ? (
            <div className="loading-placeholder">جاري التحميل...</div>
          ) : agents.length === 0 ? (
            <div className="empty-placeholder">لا يوجد وكلاء</div>
          ) : (
            <div className="agents-list">
              {agents.map((agent) => (
                <div key={agent.id} className="agent-item">
                  <div className="agent-avatar">
                    <Bot size={20} />
                  </div>
                  <div className="agent-info">
                    <span className="agent-name">{agent.name}</span>
                    <span className="agent-provider">{agent.provider}</span>
                  </div>
                  <div className="agent-stats">
                    <div className="agent-balance">
                      <span className="balance-value">
                        {formatCurrency(agent.wallet?.balance ?? 0)}
                      </span>
                      <span className="balance-label">الرصيد</span>
                    </div>
                    <div className="agent-spending">
                      <div className="spending-bar">
                        <div 
                          className="spending-fill" 
                          style={{ 
                            width: `${agent.wallet ? (agent.wallet.spentToday / agent.wallet.dailyLimit) * 100 : 0}%` 
                          }}
                        />
                      </div>
                      <span className="spending-text">
                        {formatCurrency(agent.wallet?.spentToday ?? 0)} / {formatCurrency(agent.wallet?.dailyLimit ?? 0)}
                      </span>
                    </div>
                  </div>
                  <span className={`agent-status status-${agent.status}`}>
                    {agent.status === 'active' ? 'نشط' : agent.status === 'paused' ? 'متوقف' : 'معلق'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card recent-transactions animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="card-header">
            <h3 className="card-title">أحدث المعاملات</h3>
            <button className="btn btn-ghost">عرض الكل</button>
          </div>
          {isLoadingTransactions ? (
            <div className="loading-placeholder">جاري التحميل...</div>
          ) : transactions.length === 0 ? (
            <div className="empty-placeholder">لا توجد معاملات</div>
          ) : (
            <div className="transactions-list">
              {transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="transaction-item">
                  <div className="transaction-icon">
                    {tx.type === 'deposit' ? (
                      <ArrowUpRight size={18} className="tx-icon incoming" />
                    ) : (
                      <ArrowDownRight size={18} className="tx-icon outgoing" />
                    )}
                  </div>
                  <div className="transaction-info">
                    <span className="transaction-reason">{tx.reason || 'معاملة'}</span>
                    <span className="transaction-agent">{tx.agentName || 'الحساب الرئيسي'}</span>
                  </div>
                  <div className="transaction-details">
                    <span className={`transaction-amount ${tx.type === 'deposit' ? 'incoming' : 'outgoing'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </span>
                    <span className="transaction-time">{formatRelativeTime(tx.createdAt)}</span>
                  </div>
                  <div className="transaction-status">
                    {getStatusIcon(tx.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Approvals */}
        {pendingApprovals > 0 && (
          <div className="card pending-approvals animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <div className="card-header">
              <h3 className="card-title">
                <AlertCircle size={18} className="title-icon warning" />
                موافقات معلقة
              </h3>
            </div>
            <div className="approvals-list">
              {approvalRequests
                .filter(r => r.status === 'pending')
                .slice(0, 3)
                .map((request) => (
                  <div key={request.id} className="approval-item">
                    <div className="approval-header">
                      <span className="approval-agent">{request.agent.name}</span>
                      <span className={`approval-urgency urgency-${request.urgency}`}>
                        {request.urgency === 'high' ? 'عاجل' : request.urgency === 'normal' ? 'عادي' : 'منخفض'}
                      </span>
                    </div>
                    <p className="approval-reason">{request.reason}</p>
                    <div className="approval-footer">
                      <span className="approval-amount">{formatCurrency(request.amount)}</span>
                      <div className="approval-actions">
                        <button className="btn btn-primary btn-sm btn-block">مراجعة</button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Recent Activity (Audit Log) */}
        <div className="card recent-activity animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="card-header">
            <h3 className="card-title">آخر النشاطات</h3>
          </div>
          <div className="activity-list">
            {useDataStore.getState().auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="activity-item">
                <div className="activity-icon">
                  <Bot size={16} />
                </div>
                <div className="activity-content">
                  <p className="activity-text">
                    <span className="activity-agent">{log.agentName}</span>
                    <span className="activity-action">
                      {log.action === 'transaction_approval' ? 'حصل على موافقة' : 
                       log.action === 'transaction_rejection' ? 'تم رفض طلبه' :
                       log.action === 'transfer' ? 'تلقى تحويلاً' : 'قام بإجراء'}
                    </span>
                  </p>
                  <span className="activity-time">{formatRelativeTime(log.createdAt)}</span>
                </div>
              </div>
            ))}
            {useDataStore.getState().auditLogs.length === 0 && (
              <div className="empty-placeholder">لا يوجد نشاط حديث</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
