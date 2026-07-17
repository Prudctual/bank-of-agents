// ============================================
// Agent API Routes
// This is the API that AI agents use to interact with the bank
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticateAgent } from '../middleware/agentAuth.js';

export const agentApiRouter = Router();

// All routes require agent authentication
agentApiRouter.use(authenticateAgent);

// ============================================
// Balance & Wallet Endpoints
// ============================================

/**
 * GET /api/v1/agent/balance
 * Get agent's current balance and limits
 */
agentApiRouter.get('/balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await prisma.agentWallet.findUnique({
      where: { agentId: req.agent!.id },
    });

    if (!wallet) {
      throw new ApiError(404, 'محفظة الوكيل غير موجودة');
    }

    const constraints = await prisma.agentConstraints.findUnique({
      where: { agentId: req.agent!.id },
    });

    res.json({
      success: true,
      data: {
        balance: Number(wallet.balance),
        currency: wallet.currency,
        dailyLimit: Number(wallet.dailyLimit),
        spentToday: Number(wallet.spentToday),
        remainingToday: Number(wallet.dailyLimit) - Number(wallet.spentToday),
        perTransactionLimit: constraints ? Number(constraints.perTransactionLimit) : null,
        requiresApproval: constraints?.requiresApproval ?? false,
        approvalThreshold: constraints ? Number(constraints.approvalThreshold) : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/agent/can-spend/:amount
 * Check if agent can spend a specific amount
 */
agentApiRouter.get('/can-spend/:amount', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const amount = parseFloat(req.params.amount);
    
    if (isNaN(amount) || amount <= 0) {
      throw new ApiError(400, 'المبلغ غير صالح');
    }

    const wallet = await prisma.agentWallet.findUnique({
      where: { agentId: req.agent!.id },
    });

    const constraints = await prisma.agentConstraints.findUnique({
      where: { agentId: req.agent!.id },
    });

    if (!wallet) {
      throw new ApiError(404, 'محفظة الوكيل غير موجودة');
    }

    const balance = Number(wallet.balance);
    const dailyLimit = Number(wallet.dailyLimit);
    const spentToday = Number(wallet.spentToday);
    const perTransactionLimit = constraints ? Number(constraints.perTransactionLimit) : Infinity;
    const approvalThreshold = constraints ? Number(constraints.approvalThreshold) : Infinity;

    const checks = {
      hasSufficientBalance: balance >= amount,
      withinDailyLimit: (spentToday + amount) <= dailyLimit,
      withinTransactionLimit: amount <= perTransactionLimit,
      requiresApproval: constraints?.requiresApproval && amount >= approvalThreshold,
    };

    const canSpend = checks.hasSufficientBalance && 
                     checks.withinDailyLimit && 
                     checks.withinTransactionLimit &&
                     !checks.requiresApproval;

    res.json({
      success: true,
      data: {
        amount,
        canSpend,
        checks,
        message: canSpend 
          ? 'يمكن إجراء المعاملة' 
          : checks.requiresApproval 
            ? 'المبلغ يتطلب موافقة بشرية' 
            : 'لا يمكن إجراء المعاملة - تحقق من القيود',
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Spending Endpoints
// ============================================

/**
 * POST /api/v1/agent/spend
 * Request to spend money
 */
agentApiRouter.post('/spend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, reason, recipient, context } = req.body;

    if (!amount || amount <= 0) {
      throw new ApiError(400, 'المبلغ يجب أن يكون أكبر من صفر');
    }

    if (!reason) {
      throw new ApiError(400, 'سبب الصرف مطلوب');
    }

    const wallet = await prisma.agentWallet.findUnique({
      where: { agentId: req.agent!.id },
    });

    const constraints = await prisma.agentConstraints.findUnique({
      where: { agentId: req.agent!.id },
    });

    if (!wallet) {
      throw new ApiError(404, 'محفظة الوكيل غير موجودة');
    }

    const balance = Number(wallet.balance);
    const dailyLimit = Number(wallet.dailyLimit);
    const spentToday = Number(wallet.spentToday);
    const perTransactionLimit = constraints ? Number(constraints.perTransactionLimit) : Infinity;
    const approvalThreshold = constraints ? Number(constraints.approvalThreshold) : Infinity;

    // Check balance
    if (balance < amount) {
      // Create audit log for failed transaction
      await prisma.auditLog.create({
        data: {
          agentId: req.agent!.id,
          action: 'spend_failed',
          context: { amount, reason, error: 'insufficient_balance' },
          decisionReason: `رصيد غير كافٍ. المطلوب: $${amount}, المتاح: $${balance}`,
        },
      });

      throw new ApiError(400, 'رصيد غير كافٍ');
    }

    // Check daily limit
    if ((spentToday + amount) > dailyLimit) {
      await prisma.auditLog.create({
        data: {
          agentId: req.agent!.id,
          action: 'spend_failed',
          context: { amount, reason, error: 'daily_limit_exceeded' },
          decisionReason: `تجاوز الحد اليومي. المستخدم: $${spentToday}, الحد: $${dailyLimit}`,
        },
      });

      throw new ApiError(400, 'تجاوزت الحد اليومي للصرف');
    }

    // Check per-transaction limit
    if (amount > perTransactionLimit) {
      await prisma.auditLog.create({
        data: {
          agentId: req.agent!.id,
          action: 'spend_failed',
          context: { amount, reason, error: 'transaction_limit_exceeded' },
          decisionReason: `المبلغ $${amount} أكبر من الحد للمعاملة الواحدة $${perTransactionLimit}`,
        },
      });

      throw new ApiError(400, `المبلغ أكبر من الحد المسموح للمعاملة الواحدة ($${perTransactionLimit})`);
    }

    // Check if requires approval
    if (constraints?.requiresApproval && amount >= approvalThreshold) {
      // Create approval request
      const request = await prisma.approvalRequest.create({
        data: {
          agentId: req.agent!.id,
          amount,
          reason,
          urgency: amount >= approvalThreshold * 2 ? 'high' : 'normal',
        },
      });

      // Create notification for the user
      await prisma.notification.create({
        data: {
          userId: req.agent!.userId,
          title: 'طلب موافقة جديد',
          message: `طلب الوكيل ${req.agent!.name} الموافقة لصرف مبلغ $${amount}. السبب: ${reason}`,
          type: 'warning',
          metadata: { 
            requestId: request.id,
            agentId: req.agent!.id,
            amount: Number(amount),
            reason 
          }
        }
      });

      await prisma.auditLog.create({
        data: {
          agentId: req.agent!.id,
          action: 'spend_pending_approval',
          context: { amount, reason, requestId: request.id },
          decisionReason: `المبلغ $${amount} يتطلب موافقة بشرية (عتبة الموافقة: $${approvalThreshold})`,
        },
      });

      res.status(202).json({
        success: true,
        status: 'pending_approval',
        message: 'تم إرسال الطلب للموافقة البشرية',
        data: {
          requestId: request.id,
          amount,
          reason,
          urgency: request.urgency,
        },
      });
      return;
    }

    // Process the spending
    const [transaction] = await prisma.$transaction([
      // Create transaction
      prisma.transaction.create({
        data: {
          fromWalletId: wallet.id,
          agentId: req.agent!.id,
          amount,
          type: 'api_payment',
          status: 'completed',
          reason,
          metadata: { recipient, context },
        },
      }),
      // Update wallet
      prisma.agentWallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: amount },
          spentToday: { increment: amount },
        },
      }),
    ]);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        agentId: req.agent!.id,
        transactionId: transaction.id,
        action: 'spend_completed',
        context: { amount, reason, recipient },
        decisionReason: `تم صرف $${amount} بنجاح. السبب: ${reason}`,
      },
    });

    // Update last active
    await prisma.agent.update({
      where: { id: req.agent!.id },
      data: { lastActiveAt: new Date() },
    });

    const updatedWallet = await prisma.agentWallet.findUnique({
      where: { agentId: req.agent!.id },
    });

    res.json({
      success: true,
      status: 'completed',
      message: 'تم صرف المبلغ بنجاح',
      data: {
        transactionId: transaction.id,
        amount,
        reason,
        newBalance: Number(updatedWallet!.balance),
        remainingToday: Number(updatedWallet!.dailyLimit) - Number(updatedWallet!.spentToday),
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/agent/approval-status/:requestId
 * Check status of an approval request
 */
agentApiRouter.get('/approval-status/:requestId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.approvalRequest.findFirst({
      where: {
        id: req.params.requestId,
        agentId: req.agent!.id,
      },
    });

    if (!request) {
      throw new ApiError(404, 'طلب الموافقة غير موجود');
    }

    res.json({
      success: true,
      data: {
        requestId: request.id,
        amount: Number(request.amount),
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Transaction History
// ============================================

/**
 * GET /api/v1/agent/transactions
 * Get agent's transaction history
 */
agentApiRouter.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = '20', offset = '0' } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { agentId: req.agent!.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    res.json({
      success: true,
      data: transactions.map(t => ({
        id: t.id,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        reason: t.reason,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// Agent Info
// ============================================

/**
 * GET /api/v1/agent/info
 * Get agent's information
 */
agentApiRouter.get('/info', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.agent!.id },
      include: {
        wallet: true,
        constraints: true,
      },
    });

    if (!agent) {
      throw new ApiError(404, 'الوكيل غير موجود');
    }

    res.json({
      success: true,
      data: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.type,
        provider: agent.provider,
        status: agent.status,
        trustScore: agent.trustScore,
        wallet: {
          balance: Number(agent.wallet!.balance),
          dailyLimit: Number(agent.wallet!.dailyLimit),
          spentToday: Number(agent.wallet!.spentToday),
          currency: agent.wallet!.currency,
        },
        constraints: agent.constraints ? {
          perTransactionLimit: Number(agent.constraints.perTransactionLimit),
          requiresApproval: agent.constraints.requiresApproval,
          approvalThreshold: Number(agent.constraints.approvalThreshold),
        } : null,
        lastActiveAt: agent.lastActiveAt,
        createdAt: agent.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/agent/log
 * Log an action for audit purposes
 */
agentApiRouter.post('/log', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action, context, reason } = req.body;

    if (!action || !reason) {
      throw new ApiError(400, 'الإجراء والسبب مطلوبان');
    }

    const log = await prisma.auditLog.create({
      data: {
        agentId: req.agent!.id,
        action,
        context,
        decisionReason: reason,
      },
    });

    res.status(201).json({
      success: true,
      data: { logId: log.id },
    });
  } catch (error) {
    next(error);
  }
});
