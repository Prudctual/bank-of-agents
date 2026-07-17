// ============================================
// مصرف الوكلاء - Bank of Agents
// Type Definitions
// ============================================

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
}

// Agent Types
export type AgentStatus = 'active' | 'paused' | 'suspended';
export type AgentProvider = 'openai' | 'anthropic' | 'google' | 'custom';

export interface AgentConstraints {
  dailyLimit: number;
  perTransactionLimit: number;
  allowedRecipients: string[];
  requiresApproval: boolean;
  approvalThreshold: number;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description?: string;
  type: string;
  provider: AgentProvider;
  status: AgentStatus;
  trustScore: number;
  constraints: AgentConstraints;
  wallet: AgentWallet;
  createdAt: Date;
  lastActiveAt?: Date;
}

// Wallet Types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  updatedAt: Date;
}

export interface AgentWallet {
  id: string;
  agentId: string;
  balance: number;
  dailyLimit: number;
  spentToday: number;
  currency: string;
  updatedAt: Date;
}

// Transaction Types
export type TransactionType = 'deposit' | 'withdrawal' | 'transfer' | 'api_payment' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'pending_approval';

export interface Transaction {
  id: string;
  fromWalletId?: string;
  toWalletId?: string;
  agentId?: string;
  agentName?: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

// Audit Log Types
export interface AuditLog {
  id: string;
  agentId: string;
  agentName: string;
  transactionId?: string;
  action: string;
  context?: Record<string, unknown>;
  decisionReason: string;
  createdAt: Date;
}

// Dashboard Stats
export interface DashboardStats {
  totalBalance: number;
  totalAgents: number;
  activeAgents: number;
  todaySpending: number;
  monthlySpending: number;
  pendingApprovals: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

// Approval Request Types
export interface ApprovalRequest {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  reason: string;
  urgency: 'low' | 'normal' | 'high';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}
