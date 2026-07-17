// ============================================
// Wallets Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

export const walletsRouter = Router();

// All routes require authentication
walletsRouter.use(authenticate);

// Get user wallet with agent wallets
walletsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    const agentWallets = await prisma.agentWallet.findMany({
      where: {
        agent: { userId: req.user!.userId },
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    // Calculate totals
    const totalAgentBalance = agentWallets.reduce(
      (sum, w) => sum + Number(w.balance),
      0
    );

    res.json({
      success: true,
      data: {
        mainWallet: wallet,
        agentWallets,
        summary: {
          mainBalance: Number(wallet?.balance || 0),
          totalAgentBalance,
          totalBalance: Number(wallet?.balance || 0) + totalAgentBalance,
          currency: wallet?.currency || 'USD',
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// Deposit to main wallet (simulated)
walletsRouter.post('/deposit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new ApiError(400, 'المبلغ يجب أن يكون أكبر من صفر');
    }

    // In production, this would integrate with Stripe or another payment provider
    const wallet = await prisma.wallet.update({
      where: { userId: req.user!.userId },
      data: { balance: { increment: amount } },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        amount,
        type: 'deposit',
        status: 'completed',
        reason: 'إيداع رصيد',
      },
    });

    res.json({
      success: true,
      message: `تم إيداع $${amount} بنجاح`,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
});

// Get wallet statistics
walletsRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Get all transactions for user's agents
    const agentIds = await prisma.agent.findMany({
      where: { userId },
      select: { id: true },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Monthly spending
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        agentId: { in: agentIds.map(a => a.id) },
        type: 'api_payment',
        status: 'completed',
        createdAt: { gte: startOfMonth },
      },
    });

    const monthlySpending = monthlyTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Today's spending
    const todayTransactions = await prisma.transaction.findMany({
      where: {
        agentId: { in: agentIds.map(a => a.id) },
        type: 'api_payment',
        status: 'completed',
        createdAt: { gte: startOfDay },
      },
    });

    const todaySpending = todayTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Pending approvals
    const pendingApprovals = await prisma.approvalRequest.count({
      where: {
        agent: { userId },
        status: 'pending',
      },
    });

    res.json({
      success: true,
      data: {
        monthlySpending,
        todaySpending,
        pendingApprovals,
        totalTransactions: monthlyTransactions.length,
      },
    });
  } catch (error) {
    next(error);
  }
});
