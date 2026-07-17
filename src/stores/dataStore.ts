// ============================================
// Data Store - يجلب البيانات الحقيقية من Backend
// ============================================

import { create } from 'zustand';
import { 
  agentsApi, 
  walletsApi, 
  transactionsApi, 
  auditApi,
  notificationsApi,
  type Agent, 
  type Transaction, 
  type ApprovalRequest,
  type AuditLog,
  type AuditStats
} from '../lib/api';

interface DataState {
  // Data
  agents: Agent[];
  transactions: Transaction[];
  approvalRequests: ApprovalRequest[];
  auditLogs: AuditLog[];
  auditStats: AuditStats | null;
  walletSummary: {
    mainBalance: number;
    totalAgentBalance: number;
    totalBalance: number;
    currency: string;
  } | null;
  stats: {
    monthlySpending: number;
    todaySpending: number;
    pendingApprovals: number;
    totalTransactions: number;
  } | null;

  // Loading states
  isLoadingAgents: boolean;
  isLoadingTransactions: boolean;
  isLoadingWallet: boolean;
  isLoadingAudit: boolean;

  // Error handling
  error: string | null;

  // Notifications
  notifications: any[]; // Using any for now to avoid import issues, should be Notification[]
  unreadNotificationsCount: number;
  isLoadingNotifications: boolean;

  // Actions
  fetchAgents: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  fetchWallet: () => Promise<void>;
  fetchApprovalRequests: () => Promise<void>;
  fetchAuditLogs: (params?: { agentId?: string; action?: string }) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  fetchAll: () => Promise<void>;
  clearData: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  // Initial state
  agents: [],
  transactions: [],
  approvalRequests: [],
  auditLogs: [],
  auditStats: null,
  walletSummary: null,
  stats: null,
  isLoadingAgents: false,
  isLoadingTransactions: false,
  isLoadingWallet: false,
  isLoadingAudit: false,
  error: null,

  fetchAgents: async () => {
    set({ isLoadingAgents: true, error: null });
    try {
      const response = await agentsApi.list();
      if (response.success && response.data) {
        // Transform data to ensure numbers
        const agents = response.data.map(agent => ({
          ...agent,
          wallet: agent.wallet ? {
            ...agent.wallet,
            balance: Number(agent.wallet.balance),
            dailyLimit: Number(agent.wallet.dailyLimit),
            spentToday: Number(agent.wallet.spentToday),
          } : null,
          constraints: agent.constraints ? {
            ...agent.constraints,
            perTransactionLimit: Number(agent.constraints.perTransactionLimit),
            approvalThreshold: Number(agent.constraints.approvalThreshold),
          } : null,
        }));
        set({ agents, isLoadingAgents: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'فشل تحميل الوكلاء',
        isLoadingAgents: false 
      });
    }
  },

  fetchTransactions: async () => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const response = await transactionsApi.list({ limit: 50 });
      if (response.success && response.data) {
        const transactions = response.data.map(tx => ({
          ...tx,
          amount: Number(tx.amount),
        }));
        set({ transactions, isLoadingTransactions: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'فشل تحميل المعاملات',
        isLoadingTransactions: false 
      });
    }
  },

  fetchWallet: async () => {
    set({ isLoadingWallet: true, error: null });
    try {
      const [walletRes, statsRes] = await Promise.all([
        walletsApi.get(),
        walletsApi.stats(),
      ]);

      if (walletRes.success && walletRes.data) {
        set({ walletSummary: walletRes.data.summary });
      }

      if (statsRes.success && statsRes.data) {
        set({ stats: statsRes.data });
      }

      set({ isLoadingWallet: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'فشل تحميل المحفظة',
        isLoadingWallet: false 
      });
    }
  },

  fetchApprovalRequests: async () => {
    try {
      // Fetch all approval requests (not just pending)
      const response = await transactionsApi.pendingApprovals();
      if (response.success && response.data) {
        const requests = response.data.map(req => ({
          ...req,
          amount: Number(req.amount),
        }));
        set({ approvalRequests: requests });
      }
    } catch (error) {
      console.error('Failed to fetch approval requests:', error);
    }
  },

  fetchAuditLogs: async (params) => {
    set({ isLoadingAudit: true });
    try {
      const [logsRes, statsRes] = await Promise.all([
        auditApi.list(params),
        auditApi.stats()
      ]);

      if (logsRes.success && logsRes.data) {
        set({ auditLogs: logsRes.data });
      }

      if (statsRes.success && statsRes.data) {
        set({ auditStats: statsRes.data });
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      set({ isLoadingAudit: false });
    }
  },

  // Notification State
  notifications: [],
  unreadNotificationsCount: 0,
  isLoadingNotifications: false,

  fetchNotifications: async () => {
    try {
      const response = await notificationsApi.getAll();
      if (response.success && response.data) {
        set({ 
          notifications: response.data,
          unreadNotificationsCount: response.data.filter(n => !n.isRead).length
        });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  markNotificationRead: async (id: string) => {
    try {
      const { notifications, unreadNotificationsCount } = get();
      
      // Optimistic update
      set({
        notifications: notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadNotificationsCount: Math.max(0, unreadNotificationsCount - 1)
      });

      await notificationsApi.markAsRead(id);
    } catch (error) {
      // Revert if failed (optional, but good practice)
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const { notifications } = get();
      
      // Optimistic update
      set({
        notifications: notifications.map(n => ({ ...n, isRead: true })),
        unreadNotificationsCount: 0
      });

      await notificationsApi.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  fetchAll: async () => {
    const { fetchAgents, fetchTransactions, fetchWallet, fetchApprovalRequests, fetchAuditLogs } = get();
    await Promise.all([
      fetchAgents(),
      fetchTransactions(),
      fetchWallet(),
      fetchApprovalRequests(),
      fetchAuditLogs(),
    ]);
  },

  clearData: () => {
    set({
      agents: [],
      transactions: [],
      approvalRequests: [],
      auditLogs: [],
      auditStats: null,
      walletSummary: null,
      stats: null,
    });
  },
}));
