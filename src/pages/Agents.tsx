// ============================================
// Agents Page
// صفحة إدارة الوكلاء
// ============================================

import { useEffect, useState } from 'react';
import { 
  Bot, 
  Plus, 
  MoreVertical, 
  Wallet,
  TrendingUp,
  Settings,
  Pause,
  Play,
  Trash2,
  Key,
  RefreshCw,
  X,
  DollarSign,
  Loader2
} from 'lucide-react';
import { useDataStore } from '../stores/dataStore';
import { agentsApi, type Agent } from '../lib/api';
import './Agents.css';

export function Agents() {
  const { agents, isLoadingAgents, fetchAgents, fetchWallet } = useDataStore();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState<string | null>(null);
  const [showFundModal, setShowFundModal] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getProviderColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return '#10a37f';
      case 'anthropic':
        return '#d4a27f';
      case 'google':
        return '#4285f4';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="agents-page">
      {/* Header Actions */}
      <div className="page-actions">
        <button 
          className="btn btn-ghost"
          onClick={() => fetchAgents()}
          disabled={isLoadingAgents}
        >
          <RefreshCw size={16} className={isLoadingAgents ? 'spin' : ''} />
          تحديث
        </button>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={18} />
          إضافة وكيل جديد
        </button>
      </div>

      {/* Agents Grid */}
      {isLoadingAgents ? (
        <div className="loading-state">
          <RefreshCw size={32} className="spin" />
          <p>جاري تحميل الوكلاء...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <Bot size={48} />
          <h3>لا يوجد وكلاء</h3>
          <p>ابدأ بإضافة وكيل ذكاء اصطناعي جديد</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={18} />
            إضافة وكيل
          </button>
        </div>
      ) : (
        <div className="agents-grid">
          {agents.map((agent) => (
            <div 
              key={agent.id} 
              className={`agent-card ${selectedAgent?.id === agent.id ? 'selected' : ''}`}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="agent-card-header">
                <div className="agent-avatar-large">
                  <Bot size={24} />
                </div>
                <button className="btn btn-icon">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="agent-card-body">
                <h3 className="agent-card-name">{agent.name}</h3>
                <p className="agent-card-description">{agent.description}</p>
                
                <div className="agent-card-meta">
                  <span 
                    className="provider-badge"
                    style={{ 
                      backgroundColor: `${getProviderColor(agent.provider)}20`,
                      color: getProviderColor(agent.provider)
                    }}
                  >
                    {agent.provider}
                  </span>
                  <span className={`status-badge status-${agent.status}`}>
                    {agent.status === 'active' ? 'نشط' : agent.status === 'paused' ? 'متوقف' : 'معلق'}
                  </span>
                </div>
              </div>

              <div className="agent-card-stats">
                <div className="agent-stat">
                  <div className="stat-icon-small">
                    <Wallet size={14} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{formatCurrency(agent.wallet?.balance ?? 0)}</span>
                    <span className="stat-label">الرصيد</span>
                  </div>
                </div>
                <div className="agent-stat">
                  <div className="stat-icon-small">
                    <TrendingUp size={14} />
                  </div>
                  <div className="stat-content">
                    <span className="stat-value">{formatCurrency(agent.wallet?.spentToday ?? 0)}</span>
                    <span className="stat-label">إنفاق اليوم</span>
                  </div>
                </div>
              </div>

              <div className="agent-card-progress">
                <div className="progress-header">
                  <span>الحد اليومي</span>
                  <span>{formatCurrency(agent.wallet?.dailyLimit ?? 0)}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${agent.wallet ? (agent.wallet.spentToday / agent.wallet.dailyLimit) * 100 : 0}%` 
                    }}
                  />
                </div>
              </div>

              <div className="agent-card-footer">
                <span className="trust-score">
                  درجة الثقة: <strong>{agent.trustScore}%</strong>
                </span>
                <div className="agent-actions">
                  <button 
                    className="btn btn-icon btn-sm btn-fund"
                    title="تمويل الوكيل"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowFundModal(agent);
                    }}
                  >
                    <DollarSign size={14} />
                  </button>
                  <button 
                    className="btn btn-icon btn-sm"
                    title={agent.status === 'active' ? 'إيقاف' : 'تشغيل'}
                  >
                    {agent.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button className="btn btn-icon btn-sm" title="الإعدادات">
                    <Settings size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <CreateAgentModal 
          onClose={() => setShowCreateModal(false)}
          onCreated={(newAgent) => {
            setShowApiKey(newAgent.apiKey);
            setShowCreateModal(false);
            fetchAgents();
          }}
        />
      )}

      {/* Fund Agent Modal */}
      {showFundModal && (
        <FundAgentModal 
          agent={showFundModal}
          onClose={() => setShowFundModal(null)}
          onFunded={() => {
            setShowFundModal(null);
            fetchAgents();
            fetchWallet();
          }}
        />
      )}

      {/* API Key Display Modal */}
      {showApiKey && (
        <div className="modal-overlay" onClick={() => setShowApiKey(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>مفتاح API الجديد</h2>
              <button className="btn btn-icon" onClick={() => setShowApiKey(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="api-key-alert">
                <Key size={24} />
                <p>احفظ هذا المفتاح في مكان آمن. لن تتمكن من رؤيته مرة أخرى!</p>
              </div>
              <code className="api-key-display">{showApiKey}</code>
              <button 
                className="btn btn-primary"
                onClick={() => navigator.clipboard.writeText(showApiKey)}
              >
                نسخ المفتاح
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Create Agent Modal Component
function CreateAgentModal({ 
  onClose, 
  onCreated 
}: { 
  onClose: () => void;
  onCreated: (agent: Agent & { apiKey: string }) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('assistant');
  const [provider, setProvider] = useState('openai');
  const [dailyLimit, setDailyLimit] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await agentsApi.create({
        name,
        description,
        type,
        provider,
        dailyLimit,
      });

      if (response.success && response.data) {
        onCreated(response.data);
      } else {
        setError('فشل إنشاء الوكيل');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>إضافة وكيل جديد</h2>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">اسم الوكيل</label>
            <input
              type="text"
              className="form-input"
              placeholder="مثال: وكيل التحليل المالي"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">الوصف</label>
            <textarea
              className="form-input form-textarea"
              placeholder="وصف مختصر لمهام الوكيل"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">النوع</label>
              <select 
                className="form-input"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="assistant">مساعد عام</option>
                <option value="analyzer">محلل بيانات</option>
                <option value="support">دعم العملاء</option>
                <option value="researcher">باحث</option>
                <option value="custom">مخصص</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">المزود</label>
              <select 
                className="form-input"
                value={provider}
                onChange={e => setProvider(e.target.value)}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="custom">مخصص</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">الحد اليومي (USD)</label>
            <input
              type="number"
              className="form-input"
              placeholder="100"
              value={dailyLimit}
              onChange={e => setDailyLimit(Number(e.target.value))}
              min={1}
              max={10000}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              إلغاء
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !name}
            >
              {isLoading ? 'جاري الإنشاء...' : 'إنشاء الوكيل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Fund Agent Modal Component
function FundAgentModal({ 
  agent,
  onClose, 
  onFunded 
}: { 
  agent: Agent;
  onClose: () => void;
  onFunded: () => void;
}) {
  const [amount, setAmount] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await agentsApi.fund(agent.id, amount);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onFunded();
        }, 1500);
      } else {
        setError('فشل تمويل الوكيل');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [25, 50, 100, 200, 500];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>تمويل الوكيل</h2>
          <button className="btn btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form className="modal-body" onSubmit={handleSubmit}>
          {success ? (
            <div className="fund-success">
              <div className="success-icon">✓</div>
              <h3>تم التمويل بنجاح!</h3>
              <p>تم إضافة {formatCurrency(amount)} إلى محفظة {agent.name}</p>
            </div>
          ) : (
            <>
              <div className="fund-agent-info">
                <div className="agent-icon">
                  <Bot size={24} />
                </div>
                <div>
                  <h3>{agent.name}</h3>
                  <p>الرصيد الحالي: {formatCurrency(agent.wallet?.balance ?? 0)}</p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">المبلغ (USD)</label>
                <input
                  type="number"
                  className="form-input amount-input"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  min={1}
                  max={10000}
                  required
                />
              </div>

              <div className="quick-amounts">
                {quickAmounts.map(qa => (
                  <button
                    key={qa}
                    type="button"
                    className={`quick-amount-btn ${amount === qa ? 'active' : ''}`}
                    onClick={() => setAmount(qa)}
                  >
                    ${qa}
                  </button>
                ))}
              </div>

              {error && <div className="form-error">{error}</div>}

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={isLoading || amount <= 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      جاري التمويل...
                    </>
                  ) : (
                    <>
                      <DollarSign size={16} />
                      تمويل {formatCurrency(amount)}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

