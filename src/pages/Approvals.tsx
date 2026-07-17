// ============================================
// Approvals Page
// صفحة طلبات الموافقة
// ============================================

import { useEffect, useState } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Bot,
  Loader2
} from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { transactionsApi, type ApprovalRequest } from '../lib/api';
import './Approvals.css';

export function Approvals() {
  const { approvalRequests, fetchApprovalRequests, fetchAll } = useDataStore();
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchApprovalRequests();
  }, [fetchApprovalRequests]);

  const handleApprove = async (request: ApprovalRequest) => {
    setProcessingId(request.id);
    try {
      await transactionsApi.approve(request.id);
      await fetchAll(); // Refresh all data
    } catch (error) {
      console.error('Failed to approve:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: ApprovalRequest) => {
    setProcessingId(request.id);
    try {
      await transactionsApi.reject(request.id);
      await fetchApprovalRequests();
    } catch (error) {
      console.error('Failed to reject:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchApprovalRequests();
    setIsLoading(false);
  };

  const filteredRequests = approvalRequests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const pendingCount = approvalRequests.filter(r => r.status === 'pending').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={18} className="status-icon approved" />;
      case 'rejected':
        return <XCircle size={18} className="status-icon rejected" />;
      default:
        return <Clock size={18} className="status-icon pending" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'تمت الموافقة';
      case 'rejected':
        return 'مرفوض';
      default:
        return 'في الانتظار';
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <span className="urgency-badge high">عاجل</span>;
      case 'normal':
        return <span className="urgency-badge normal">عادي</span>;
      default:
        return <span className="urgency-badge low">منخفض</span>;
    }
  };

  return (
    <div className="approvals-page">
      {/* Header */}
      <div className="approvals-header">
        <div className="approvals-stats">
          <div className="stat-pill pending">
            <Clock size={16} />
            <span>{pendingCount} في الانتظار</span>
          </div>
        </div>
        
        <div className="approvals-actions">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              في الانتظار
            </button>
            <button 
              className={`filter-tab ${filter === 'approved' ? 'active' : ''}`}
              onClick={() => setFilter('approved')}
            >
              تمت الموافقة
            </button>
            <button 
              className={`filter-tab ${filter === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilter('rejected')}
            >
              مرفوض
            </button>
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              الكل
            </button>
          </div>
          
          <button 
            className="btn btn-ghost"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? 'spin' : ''} />
            تحديث
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} />
          <h3>لا توجد طلبات</h3>
          <p>
            {filter === 'pending' 
              ? 'لا توجد طلبات موافقة معلقة حالياً' 
              : 'لا توجد طلبات في هذه الفئة'}
          </p>
        </div>
      ) : (
        <div className="requests-list">
          {filteredRequests.map((request) => (
            <div 
              key={request.id} 
              className={`request-card ${request.status}`}
            >
              <div className="request-header">
                <div className="request-agent">
                  <div className="agent-icon">
                    <Bot size={20} />
                  </div>
                  <div className="agent-details">
                    <span className="agent-name">{request.agent.name}</span>
                    <span className="request-time">{formatDate(request.createdAt)}</span>
                  </div>
                </div>
                <div className="request-meta">
                  {getUrgencyBadge(request.urgency)}
                  <div className={`status-badge ${request.status}`}>
                    {getStatusIcon(request.status)}
                    <span>{getStatusText(request.status)}</span>
                  </div>
                </div>
              </div>

              <div className="request-body">
                <p className="request-reason">{request.reason}</p>
                <div className="request-amount">
                  <span className="amount-label">المبلغ المطلوب</span>
                  <span className="amount-value">{formatCurrency(request.amount)}</span>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="btn btn-reject"
                    onClick={() => handleReject(request)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <>
                        <XCircle size={16} />
                        رفض
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-approve"
                    onClick={() => handleApprove(request)}
                    disabled={processingId === request.id}
                  >
                    {processingId === request.id ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        موافقة
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
