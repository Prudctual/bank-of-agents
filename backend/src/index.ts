// ============================================
// مصرف الوكلاء - Bank of Agents
// Main Server Entry Point
// ============================================

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth.js';
import { agentsRouter } from './routes/agents.js';
import { walletsRouter } from './routes/wallets.js';
import { transactionsRouter } from './routes/transactions.js';
import { agentApiRouter } from './routes/agent-api.js';
import { auditRouter } from './routes/audit.js';
import { notificationsRouter } from './routes/notifications.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'مصرف الوكلاء يعمل بنجاح!',
    timestamp: new Date().toISOString() 
  });
});

// Welcome page
app.get('/', (req, res) => {
  res.json({
    name: '🏦 مصرف الوكلاء - Bank of Agents',
    version: '1.0.0',
    description: 'البنية التحتية المالية لاقتصاد الآلة',
    endpoints: {
      health: 'GET /health',
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
        me: 'GET /api/v1/auth/me',
      },
      agents: {
        list: 'GET /api/v1/agents',
        create: 'POST /api/v1/agents',
        get: 'GET /api/v1/agents/:id',
        update: 'PATCH /api/v1/agents/:id',
        delete: 'DELETE /api/v1/agents/:id',
        fund: 'POST /api/v1/agents/:id/fund',
      },
      wallets: {
        get: 'GET /api/v1/wallets',
        deposit: 'POST /api/v1/wallets/deposit',
        stats: 'GET /api/v1/wallets/stats',
      },
      transactions: {
        list: 'GET /api/v1/transactions',
        get: 'GET /api/v1/transactions/:id',
        pendingApprovals: 'GET /api/v1/transactions/approvals/pending',
        approve: 'POST /api/v1/transactions/approvals/:id/approve',
        reject: 'POST /api/v1/transactions/approvals/:id/reject',
      },
      agentApi: {
        description: 'Agent Authentication: Header "x-agent-key: YOUR_KEY"',
        balance: 'GET /api/v1/agent/balance',
        canSpend: 'GET /api/v1/agent/can-spend/:amount',
        spend: 'POST /api/v1/agent/spend',
        transactions: 'GET /api/v1/agent/transactions',
        info: 'GET /api/v1/agent/info',
      },
    },
    demoCredentials: {
      email: 'demo@bankofagents.com',
      password: 'demo123',
    },
  });
});

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/wallets', walletsRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/notifications', notificationsRouter);

// Agent API (for AI agents to communicate with the bank)
app.use('/api/v1/agent', agentApiRouter);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'المسار غير موجود' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════╗
  ║                                            ║
  ║   🏦 مصرف الوكلاء - Bank of Agents        ║
  ║                                            ║
  ║   Server running on port ${PORT}             ║
  ║   Environment: ${process.env.NODE_ENV}              ║
  ║                                            ║
  ╚════════════════════════════════════════════╝
  `);
});

export default app;
