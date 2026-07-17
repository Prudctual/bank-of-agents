// ============================================
// Transactions Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

export const transactionsRouter = Router();

// All routes require authentication
transactionsRouter.use(authenticate);

// Get all transactions for user
transactionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, status, limit = '50', offset = '0' } = req.query;

    // Get user's agent IDs
    const agents = await prisma.agent.findMany({
      where: { userId: req.user!.userId },
      select: { id: true, name: true },
    });

    const agentIds = agents.map(a => a.id);
    const agentMap = new Map(agents.map(a => [a.id, a.name]));

    const where: Record<string, unknown> = {
      OR: [
        { agentId: { in: agentIds } },
        { agentId: null }, // User's direct transactions
      ],
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Add agent names
    const transactionsWithNames = transactions.map(t => ({
      ...t,
      agentName: t.agentId ? agentMap.get(t.agentId) : null,
    }));

    const total = await prisma.transaction.count({ where });

    res.json({
      success: true,
      data: transactionsWithNames,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get single transaction
transactionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        agent: {
          select: { id: true, name: true, userId: true },
        },
        auditLog: true,
      },
    });

    if (!transaction) {
      throw new ApiError(404, 'المعاملة غير موجودة');
    }

    // Check ownership
    if (transaction.agent && transaction.agent.userId !== req.user!.userId) {
      throw new ApiError(403, 'غير مصرح بالوصول لهذه المعاملة');
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
});

// Get approval requests
transactionsRouter.get('/approvals/pending', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    
    const where: Record<string, unknown> = {
      agent: { userId: req.user!.userId },
    };
    
    // Filter by status if provided, otherwise get all
    if (status && ['pending', 'approved', 'rejected'].includes(status as string)) {
      where.status = status;
    }

    const requests = await prisma.approvalRequest.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
});

// Approve request
transactionsRouter.post('/approvals/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: req.params.id },
      include: {
        agent: {
          include: { wallet: true },
        },
      },
    });

    if (!request) {
      throw new ApiError(404, 'الطلب غير موجود');
    }

    if (request.agent.userId !== req.user!.userId) {
      throw new ApiError(403, 'غير مصرح');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, 'الطلب تمت معالجته مسبقاً');
    }

    // Check agent wallet balance
    if (Number(request.agent.wallet!.balance) < Number(request.amount)) {
      throw new ApiError(400, 'رصيد الوكيل غير كافٍ');
    }

    // Process the approval
    await prisma.$transaction([
      // Update request status
      prisma.approvalRequest.update({
        where: { id: request.id },
        data: { status: 'approved' },
      }),
      // Deduct from agent wallet
      prisma.agentWallet.update({
        where: { id: request.agent.wallet!.id },
        data: { 
          balance: { decrement: request.amount },
          spentToday: { increment: request.amount },
        },
      }),
      // Create transaction
      prisma.transaction.create({
        data: {
          fromWalletId: request.agent.wallet!.id,
          agentId: request.agent.id,
          amount: request.amount,
          type: 'api_payment',
          status: 'completed',
          reason: request.reason,
        },
      }),
    ]);

    res.json({
      success: true,
      message: 'تمت الموافقة على الطلب',
    });
  } catch (error) {
    next(error);
  }
});

// Reject request
transactionsRouter.post('/approvals/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await prisma.approvalRequest.findUnique({
      where: { id: req.params.id },
      include: { agent: true },
    });

    if (!request) {
      throw new ApiError(404, 'الطلب غير موجود');
    }

    if (request.agent.userId !== req.user!.userId) {
      throw new ApiError(403, 'غير مصرح');
    }

    await prisma.approvalRequest.update({
      where: { id: request.id },
      data: { status: 'rejected' },
    });

    res.json({
      success: true,
      message: 'تم رفض الطلب',
    });
  } catch (error) {
    next(error);
  }
});
