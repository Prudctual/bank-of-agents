// ============================================
// API Client for Bank of Agents Backend
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Token management
let authToken: string | null = localStorage.getItem('token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => authToken;

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'حدث خطأ في الطلب');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============================================
// Auth API
// ============================================

export const authApi = {
  register: (email: string, password: string, name: string) =>
    apiRequest<{ user: { id: string; email: string; name: string }; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    apiRequest<{ user: { id: string; email: string; name: string }; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () =>
    apiRequest<{ user: { id: string; email: string; name: string }; wallet: unknown; agents: unknown[] }>('/auth/me'),
};

// ============================================
// Agents API
// ============================================

export interface Agent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  provider: string;
  status: string;
  trustScore: number;
  wallet: {
    balance: number;
    dailyLimit: number;
    spentToday: number;
  } | null;
  constraints: {
    perTransactionLimit: number;
    requiresApproval: boolean;
    approvalThreshold: number;
  } | null;
}

export const agentsApi = {
  list: () => apiRequest<Agent[]>('/agents'),

  get: (id: string) => apiRequest<Agent>(`/agents/${id}`),

  create: (data: {
    name: string;
    description?: string;
    type: string;
    provider?: string;
    dailyLimit?: number;
  }) =>
    apiRequest<Agent & { apiKey: string }>('/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Agent>) =>
    apiRequest<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest(`/agents/${id}`, {
      method: 'DELETE',
    }),

  fund: (id: string, amount: number) =>
    apiRequest<Agent>(`/agents/${id}/fund`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  regenerateKey: (id: string) =>
    apiRequest<{ apiKey: string }>(`/agents/${id}/regenerate-key`, {
      method: 'POST',
    }),
};

// ============================================
// Wallets API
// ============================================

export interface WalletSummary {
  mainWallet: {
    id: string;
    balance: number;
    currency: string;
  };
  agentWallets: {
    id: string;
    balance: number;
    dailyLimit: number;
    spentToday: number;
    agent: {
      id: string;
      name: string;
      status: string;
    };
  }[];
  summary: {
    mainBalance: number;
    totalAgentBalance: number;
    totalBalance: number;
    currency: string;
  };
}

export const walletsApi = {
  get: () => apiRequest<WalletSummary>('/wallets'),

  deposit: (amount: number) =>
    apiRequest('/wallets/deposit', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    }),

  stats: () =>
    apiRequest<{
      monthlySpending: number;
      todaySpending: number;
      pendingApprovals: number;
      totalTransactions: number;
    }>('/wallets/stats'),
};

// ============================================
// Transactions API
// ============================================

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  status: string;
  reason: string | null;
  agentName: string | null;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  amount: number;
  reason: string;
  urgency: string;
  status: string;
  agent: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export const transactionsApi = {
  list: (params?: { type?: string; status?: string; limit?: number; offset?: number }) => {
    const query = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return apiRequest<Transaction[]>(`/transactions${query}`);
  },

  get: (id: string) => apiRequest<Transaction>(`/transactions/${id}`),

  pendingApprovals: (status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiRequest<ApprovalRequest[]>(`/transactions/approvals/pending${query}`);
  },

  approve: (id: string) =>
    apiRequest(`/transactions/approvals/${id}/approve`, {
      method: 'POST',
    }),

  reject: (id: string) =>
    apiRequest(`/transactions/approvals/${id}/reject`, {
      method: 'POST',
    }),
};

// ============================================
// Audit API
// ============================================

export interface AuditLog {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  context: any;
  decisionReason: string;
  createdAt: string;
  transaction?: {
    id: string;
    amount: string;
    type: string;
    status: string;
  };
}

export interface AuditStats {
  totalLogs: number;
  recentActivity: number;
  byAction: Record<string, number>;
}

export const auditApi = {
  list: (params?: { agentId?: string; action?: string; limit?: number; offset?: number }) => {
    const query = params
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return apiRequest<AuditLog[]>(`/audit${query}`);
  },

  stats: () => apiRequest<AuditStats>('/audit/stats'),
};


// ============================================
// Notifications API
// ============================================

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

export const notificationsApi = {
  // Get all notifications
  getAll: (unreadOnly = false) => 
    apiRequest<Notification[]>(`/notifications?unreadOnly=${unreadOnly}`),
  
  // Mark as read
  markAsRead: (id: string) => 
    apiRequest<{ success: true }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),
    
  // Mark all as read
  markAllAsRead: () => 
    apiRequest<{ success: true }>('/notifications/read-all', {
      method: 'POST',
    }),
};


