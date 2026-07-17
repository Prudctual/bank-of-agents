// ============================================
// Agents Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

export const agentsRouter = Router();

// All routes require authentication
agentsRouter.use(authenticate);

// Get all agents for user
agentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId: req.user!.userId },
      include: {
        wallet: true,
        constraints: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: agents,
    });
  } catch (error) {
    next(error);
  }
});

// Get single agent
agentsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await prisma.agent.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        wallet: true,
        constraints: true,
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!agent) {
      throw new ApiError(404, 'الوكيل غير موجود');
    }

    res.json({
      success: true,
      data: agent,
    });
  } catch (error) {
    next(error);
  }
});

// Create agent
agentsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, type, provider, dailyLimit, perTransactionLimit } = req.body;

    if (!name || !type) {
      throw new ApiError(400, 'اسم الوكيل ونوعه مطلوبان');
    }

    // Generate API key for the agent
    const apiKey = `agent_${uuidv4().replace(/-/g, '')}`;

    const agent = await prisma.agent.create({
      data: {
        userId: req.user!.userId,
        name,
        description,
        type,
        provider: provider || 'openai',
        apiKey,
        wallet: {
          create: {
            balance: 0,
            dailyLimit: dailyLimit || 50,
            currency: 'USD',
          },
        },
        constraints: {
          create: {
            perTransactionLimit: perTransactionLimit || 10,
            allowedRecipients: [],
            requiresApproval: true,
            approvalThreshold: 25,
          },
        },
      },
      include: {
        wallet: true,
        constraints: true,
      },
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الوكيل بنجاح',
      data: {
        ...agent,
        apiKey, // Return API key only on creation
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update agent
agentsRouter.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, status, dailyLimit, constraints } = req.body;

    // Check ownership
    const existingAgent = await prisma.agent.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!existingAgent) {
      throw new ApiError(404, 'الوكيل غير موجود');
    }

    const agent = await prisma.agent.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(dailyLimit && {
          wallet: {
            update: { dailyLimit },
          },
        }),
        ...(constraints && {
          constraints: {
            update: constraints,
          },
        }),
      },
      include: {
        wallet: true,
        constraints: true,
      },
    });

    res.json({
      success: true,
      message: 'تم تحديث الوكيل بنجاح',
      data: agent,
    });
  } catch (error) {
    next(error);
  }
});

// Delete agent
agentsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check ownership
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!agent) {
      throw new ApiError(404, 'الوكيل غير موجود');
    }

    await prisma.agent.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'تم حذف الوكيل بنجاح',
    });
  } catch (error) {
    next(error);
  }
});

// Fund agent wallet
agentsRouter.post('/:id/fund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new ApiError(400, 'المبلغ يجب أن يكون أكبر من صفر');
    }

    // Check ownership and get agent
    const agent = await prisma.agent.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { wallet: true },
    });

    if (!agent) {
      throw new ApiError(404, 'الوكيل غير موجود');
    }

    // Get user wallet
    const userWallet = await prisma.wallet.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!userWallet || Number(userWallet.balance) < amount) {
      throw new ApiError(400, 'رصيد غير كافٍ');
    }

    // Perform transfer
    await prisma.$transaction([
      // Deduct from user wallet
      prisma.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: amount } },
      }),
      // Add to agent wallet
      prisma.agentWallet.update({
        where: { id: agent.wallet!.id },
        data: { balance: { increment: amount } },
      }),
      // Create transaction record
      prisma.transaction.create({
        data: {
          toWalletId: agent.wallet!.id,
          agentId: agent.id,
          amount,
          type: 'transfer',
          status: 'completed',
          reason: `تمويل الوكيل: ${agent.name}`,
        },
      }),
    ]);

    // Get updated agent
    const updatedAgent = await prisma.agent.findUnique({
      where: { id: agent.id },
      include: { wallet: true },
    });

    res.json({
      success: true,
      message: `تم تمويل الوكيل بمبلغ $${amount}`,
      data: updatedAgent,
    });
  } catch (error) {
    next(error);
  }
});

// Regenerate API key
agentsRouter.post('/:id/regenerate-key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check ownership
    const existingAgent = await prisma.agent.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });

    if (!existingAgent) {
      throw new ApiError(404, 'الوكيل غير موجود');
    }

    const newApiKey = `agent_${uuidv4().replace(/-/g, '')}`;

    await prisma.agent.update({
      where: { id: req.params.id },
      data: { apiKey: newApiKey },
    });

    res.json({
      success: true,
      message: 'تم إنشاء مفتاح جديد للوكيل',
      data: { apiKey: newApiKey },
    });
  } catch (error) {
    next(error);
  }
});
