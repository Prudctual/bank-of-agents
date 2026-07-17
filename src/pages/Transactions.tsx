// ============================================
// Transactions Page
// صفحة المعاملات
// ============================================

import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import type { Transaction } from '../types';
import './Transactions.css';

export function Transactions() {
  const { transactions } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: <CheckCircle size={16} />, text: 'مكتملة', class: 'success' };
      case 'pending_approval':
        return { icon: <Clock size={16} />, text: 'بانتظار الموافقة', class: 'warning' };
      case 'pending':
        return { icon: <Clock size={16} />, text: 'قيد المعالجة', class: 'info' };
      case 'failed':
        return { icon: <XCircle size={16} />, text: 'فاشلة', class: 'error' };
      case 'cancelled':
        return { icon: <XCircle size={16} />, text: 'ملغاة', class: 'muted' };
      default:
        return { icon: <AlertCircle size={16} />, text: status, class: '' };
    }
  };

  // Get type info
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'deposit':
        return { icon: <ArrowDownRight size={18} />, text: 'إيداع', class: 'incoming' };
      case 'withdrawal':
        return { icon: <ArrowUpRight size={18} />, text: 'سحب', class: 'outgoing' };
      case 'transfer':
        return { icon: <ArrowUpRight size={18} />, text: 'تحويل', class: 'transfer' };
      case 'api_payment':
        return { icon: <ArrowUpRight size={18} />, text: 'دفع API', class: 'outgoing' };
      case 'refund':
        return { icon: <ArrowDownRight size={18} />, text: 'استرداد', class: 'incoming' };
      default:
        return { icon: <ArrowUpRight size={18} />, text: type, class: '' };
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch = 
      tx.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.agentName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesStatus = filterStatus === 'all' || tx.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate totals
  const totalIncoming = transactions
    .filter(tx => ['deposit', 'refund'].includes(tx.type) && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalOutgoing = transactions
    .filter(tx => ['withdrawal', 'api_payment', 'transfer'].includes(tx.type) && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="transactions-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">المعاملات</h1>
          <p className="page-description">
            سجل جميع العمليات المالية للحساب والوكلاء
          </p>
        </div>
        <button className="btn btn-secondary">
          <Download size={18} />
          <span>تصدير</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="transactions-summary">
        <div className="summary-card incoming">
          <div className="summary-icon">
            <ArrowDownRight size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-label">إجمالي الوارد</span>
            <span className="summary-value">+{formatCurrency(totalIncoming)}</span>
          </div>
        </div>
        <div className="summary-card outgoing">
          <div className="summary-icon">
            <ArrowUpRight size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-label">إجمالي الصادر</span>
            <span className="summary-value">-{formatCurrency(totalOutgoing)}</span>
          </div>
        </div>
        <div className="summary-card total">
          <div className="summary-icon">
            <Calendar size={20} />
          </div>
          <div className="summary-content">
            <span className="summary-label">عدد المعاملات</span>
            <span className="summary-value">{transactions.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="transactions-filters">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            placeholder="ابحث في المعاملات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-group">
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الأنواع</option>
            <option value="deposit">إيداع</option>
            <option value="withdrawal">سحب</option>
            <option value="api_payment">دفع API</option>
            <option value="transfer">تحويل</option>
          </select>
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">جميع الحالات</option>
            <option value="completed">مكتملة</option>
            <option value="pending_approval">بانتظار الموافقة</option>
            <option value="pending">قيد المعالجة</option>
            <option value="failed">فاشلة</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card transactions-table-card">
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>النوع</th>
                <th>الوصف</th>
                <th>الوكيل</th>
                <th>المبلغ</th>
                <th>الحالة</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const typeInfo = getTypeInfo(tx.type);
                const statusInfo = getStatusInfo(tx.status);
                const isIncoming = ['deposit', 'refund'].includes(tx.type);
                
                return (
                  <tr key={tx.id}>
                    <td>
                      <div className={`transaction-type ${typeInfo.class}`}>
                        {typeInfo.icon}
                        <span>{typeInfo.text}</span>
                      </div>
                    </td>
                    <td>
                      <span className="transaction-reason">{tx.reason || '-'}</span>
                    </td>
                    <td>
                      <span className="transaction-agent">{tx.agentName || 'الحساب الرئيسي'}</span>
                    </td>
                    <td>
                      <span className={`transaction-amount ${isIncoming ? 'incoming' : 'outgoing'}`}>
                        {isIncoming ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </td>
                    <td>
                      <div className={`transaction-status status-${statusInfo.class}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                      </div>
                    </td>
                    <td>
                      <span className="transaction-date">{formatDate(tx.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="empty-state">
            <Search size={48} className="empty-state-icon" />
            <h3 className="empty-state-title">لا توجد معاملات</h3>
            <p className="empty-state-description">
              {searchQuery ? `لا توجد نتائج لـ "${searchQuery}"` : 'لم يتم العثور على معاملات'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
