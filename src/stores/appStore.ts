// ============================================
// مصرف الوكلاء - Bank of Agents
// Global State Management (Zustand)
// ============================================

import { create } from 'zustand';
import type { 
  User, 
  Agent, 
  Transaction, 
  DashboardStats, 
  Notification,
  ApprovalRequest 
} from '../types';

// Mock Data
const mockUser: User = {
  id: 'user_001',
  email: 'admin@bankofagents.com',
  name: 'عبدالله المحمد',
  createdAt: new Date('2026-01-01'),
};

const mockAgents: Agent[] = [
  {
    id: 'agent_001',
    userId: 'user_001',
    name: 'وكيل التحليل المالي',
    description: 'يقوم بتحليل البيانات المالية وإعداد التقارير',
    type: 'data_analyst',
    provider: 'openai',
    status: 'active',
    trustScore: 95,
    constraints: {
      dailyLimit: 50,
      perTransactionLimit: 10,
      allowedRecipients: ['openai_api', 'aws'],
      requiresApproval: false,
      approvalThreshold: 25,
    },
    wallet: {
      id: 'wallet_agent_001',
      agentId: 'agent_001',
      balance: 125.50,
      dailyLimit: 50,
      spentToday: 12.30,
      currency: 'USD',
      updatedAt: new Date(),
    },
    createdAt: new Date('2026-01-15'),
    lastActiveAt: new Date(),
  },
  {
    id: 'agent_002',
    userId: 'user_001',
    name: 'وكيل خدمة العملاء',
    description: 'يتعامل مع استفسارات العملاء ويقدم الدعم',
    type: 'customer_service',
    provider: 'anthropic',
    status: 'active',
    trustScore: 88,
    constraints: {
      dailyLimit: 30,
      perTransactionLimit: 5,
      allowedRecipients: ['anthropic_api'],
      requiresApproval: true,
      approvalThreshold: 15,
    },
    wallet: {
      id: 'wallet_agent_002',
      agentId: 'agent_002',
      balance: 78.25,
      dailyLimit: 30,
      spentToday: 8.50,
      currency: 'USD',
      updatedAt: new Date(),
    },
    createdAt: new Date('2026-01-20'),
    lastActiveAt: new Date(),
  },
  {
    id: 'agent_003',
    userId: 'user_001',
    name: 'وكيل البحث والتطوير',
    description: 'يبحث في المصادر ويجمع المعلومات',
    type: 'researcher',
    provider: 'google',
    status: 'paused',
    trustScore: 72,
    constraints: {
      dailyLimit: 100,
      perTransactionLimit: 20,
      allowedRecipients: ['google_api', 'serpapi'],
      requiresApproval: true,
      approvalThreshold: 50,
    },
    wallet: {
      id: 'wallet_agent_003',
      agentId: 'agent_003',
      balance: 230.00,
      dailyLimit: 100,
      spentToday: 0,
      currency: 'USD',
      updatedAt: new Date(),
    },
    createdAt: new Date('2026-01-10'),
    lastActiveAt: new Date('2026-01-28'),
  },
];

const mockTransactions: Transaction[] = [
  {
    id: 'tx_001',
    agentId: 'agent_001',
    agentName: 'وكيل التحليل المالي',
    amount: 3.50,
    type: 'api_payment',
    status: 'completed',
    reason: 'تحليل بيانات المبيعات - 5000 tokens',
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
  },
  {
    id: 'tx_002',
    agentId: 'agent_002',
    agentName: 'وكيل خدمة العملاء',
    amount: 1.25,
    type: 'api_payment',
    status: 'completed',
    reason: 'الرد على استفسار عميل',
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
  },
  {
    id: 'tx_003',
    agentId: 'agent_001',
    agentName: 'وكيل التحليل المالي',
    amount: 8.80,
    type: 'api_payment',
    status: 'completed',
    reason: 'إنشاء تقرير شهري شامل',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
  {
    id: 'tx_004',
    amount: 500,
    type: 'deposit',
    status: 'completed',
    reason: 'إيداع رصيد',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  },
  {
    id: 'tx_005',
    agentId: 'agent_003',
    agentName: 'وكيل البحث والتطوير',
    amount: 45.00,
    type: 'api_payment',
    status: 'pending_approval',
    reason: 'شراء بيانات بحثية من مصدر خارجي',
    createdAt: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
  },
];

const mockApprovals: ApprovalRequest[] = [
  {
    id: 'approval_001',
    agentId: 'agent_003',
    agentName: 'وكيل البحث والتطوير',
    amount: 45.00,
    reason: 'شراء بيانات بحثية من مصدر خارجي',
    urgency: 'normal',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'approval_002',
    agentId: 'agent_002',
    agentName: 'وكيل خدمة العملاء',
    amount: 20.00,
    reason: 'ترقية الخطة للتعامل مع حجم أكبر من الطلبات',
    urgency: 'high',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 5),
  },
];

const mockNotifications: Notification[] = [
  {
    id: 'notif_001',
    type: 'warning',
    title: 'تنبيه الحد اليومي',
    message: 'وكيل التحليل المالي استهلك 75% من الحد اليومي',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10),
  },
  {
    id: 'notif_002',
    type: 'info',
    title: 'طلب موافقة جديد',
    message: 'وكيل البحث والتطوير يطلب صرف $45',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: 'notif_003',
    type: 'success',
    title: 'إيداع ناجح',
    message: 'تم إيداع $500 في حسابك الرئيسي',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
  },
];

// Calculate stats from mock data
const calculateStats = (agents: Agent[], transactions: Transaction[]): DashboardStats => {
  const totalBalance = agents.reduce((sum, agent) => sum + agent.wallet.balance, 0);
  const todaySpending = agents.reduce((sum, agent) => sum + agent.wallet.spentToday, 0);
  const activeAgents = agents.filter(a => a.status === 'active').length;
  const pendingApprovals = transactions.filter(t => t.status === 'pending_approval').length;
  
  // Calculate monthly spending (mock)
  const monthlySpending = transactions
    .filter(t => t.type === 'api_payment' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0) * 4; // Approximate

  return {
    totalBalance,
    totalAgents: agents.length,
    activeAgents,
    todaySpending,
    monthlySpending,
    pendingApprovals,
  };
};

// Store Interface
interface AppState {
  // Data
  user: User | null;
  agents: Agent[];
  transactions: Transaction[];
  notifications: Notification[];
  approvalRequests: ApprovalRequest[];
  stats: DashboardStats;
  
  // UI State
  sidebarOpen: boolean;
  currentPage: string;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  
  // Agent Actions
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  
  // Transaction Actions
  addTransaction: (transaction: Transaction) => void;
  
  // Approval Actions
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  
  // Notification Actions
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Refresh Stats
  refreshStats: () => void;
}

// Create Store
export const useAppStore = create<AppState>((set, get) => ({
  // Initial Data
  user: mockUser,
  agents: mockAgents,
  transactions: mockTransactions,
  notifications: mockNotifications,
  approvalRequests: mockApprovals,
  stats: calculateStats(mockAgents, mockTransactions),
  
  // UI State
  sidebarOpen: true,
  currentPage: 'dashboard',
  isLoading: false,
  
  // Actions
  setUser: (user) => set({ user }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  
  // Agent Actions
  addAgent: (agent) => {
    set((state) => ({ agents: [...state.agents, agent] }));
    get().refreshStats();
  },
  
  updateAgent: (id, updates) => {
    set((state) => ({
      agents: state.agents.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    }));
    get().refreshStats();
  },
  
  deleteAgent: (id) => {
    set((state) => ({
      agents: state.agents.filter((a) => a.id !== id),
    }));
    get().refreshStats();
  },
  
  // Transaction Actions
  addTransaction: (transaction) => {
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    }));
    get().refreshStats();
  },
  
  // Approval Actions
  approveRequest: (id) => {
    set((state) => ({
      approvalRequests: state.approvalRequests.map((r) =>
        r.id === id ? { ...r, status: 'approved' as const } : r
      ),
    }));
  },
  
  rejectRequest: (id) => {
    set((state) => ({
      approvalRequests: state.approvalRequests.map((r) =>
        r.id === id ? { ...r, status: 'rejected' as const } : r
      ),
    }));
  },
  
  // Notification Actions
  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  
  clearNotifications: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  
  // Refresh Stats
  refreshStats: () => {
    const { agents, transactions } = get();
    set({ stats: calculateStats(agents, transactions) });
  },
}));
