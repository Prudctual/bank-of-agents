
// ============================================
// Audit Log Page
// صفحة سجل التدقيق
// ============================================

import { useEffect, useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Bot, 
  ArrowRightLeft, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Clock
} from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import './Audit.css';

export function Audit() {
  const { 
    auditLogs, 
    auditStats, 
    agents,
    isLoadingAudit, 
    fetchAuditLogs,
    fetchAgents
  } = useDataStore();

  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('');

  useEffect(() => {
    fetchAgents();
    fetchAuditLogs();
  }, [fetchAgents, fetchAuditLogs]);

  useEffect(() => {
    fetchAuditLogs({
      agentId: selectedAgent || undefined,
      action: selectedAction || undefined
    });
  }, [selectedAgent, selectedAction, fetchAuditLogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'transaction_approval':
        return <CheckCircle size={16} className="text-success" />;
      case 'transaction_rejection':
        return <AlertCircle size={16} className="text-danger" />;
      case 'transfer':
        return <ArrowRightLeft size={16} className="text-primary" />;
      default:
        return <FileText size={16} className="text-muted" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'transaction_approval': 'موافقة على معاملة',
      'transaction_rejection': 'رفض معاملة',
      'transfer': 'تحويل مالي',
      'api_usage': 'استخدام API',
      'settings_update': 'تحديث إعدادات',
      'system_action': 'إجراء نظام'
    };
    return labels[action] || action;
  };

  return (
    <div className="audit-page">
      {/* Page Header */}
      <div className="audit-header">
        <div className="audit-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <History size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{auditStats?.totalLogs || 0}</span>
              <span className="stat-label">إجمالي السجلات</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Clock size={24} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{auditStats?.recentActivity || 0}</span>
              <span className="stat-label">نشاط آخر 24 ساعة</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="audit-filters">
          <div className="filter-group">
            <Bot size={16} className="filter-icon" />
            <select 
              className="filter-select"
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
            >
              <option value="">جميع الوكلاء</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <Filter size={16} className="filter-icon" />
            <select 
              className="filter-select"
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
            >
              <option value="">جميع الإجراءات</option>
              {Object.keys(auditStats?.byAction || {}).map(action => (
                <option key={action} value={action}>{getActionLabel(action)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="audit-list-container">
        {isLoadingAudit ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>جاري تحميل السجلات...</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="empty-state">
            <History size={48} />
            <h3>لا توجد سجلات</h3>
            <p>لم يتم تسجيل أي نشاط للوكلاء حتى الآن</p>
          </div>
        ) : (
          <div className="audit-logs">
            {auditLogs.map((log) => (
              <div key={log.id} className="audit-log-item">
                <div className="log-icon">
                  <Bot size={20} />
                </div>
                
                <div className="log-content">
                  <div className="log-header">
                    <h4 className="log-agent">{log.agentName}</h4>
                    <span className="log-date">{formatDate(log.createdAt)}</span>
                  </div>
                  
                  <div className="log-body">
                    <div className="log-action">
                      {getActionIcon(log.action)}
                      <span>{getActionLabel(log.action)}</span>
                    </div>
                    <p className="log-reason">{log.decisionReason}</p>
                  </div>

                  {log.transaction && (
                    <div className="log-meta">
                      <span className="meta-tag">
                        معاملة #{log.transaction.id.slice(0, 8)}
                      </span>
                      <span className="meta-tag amount">
                        ${Number(log.transaction.amount).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
