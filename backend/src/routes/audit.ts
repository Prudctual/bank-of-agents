// ============================================
// Audit Logs Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

export const auditRouter = Router();

// All routes require authentication
auditRouter.use(authenticate);

// Get all audit logs for user's agents
auditRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { agentId, action, limit = '50', offset = '0' } = req.query;

    // Get user's agent IDs
    const agents = await prisma.agent.findMany({
      where: { userId: req.user!.userId },
      select: { id: true, name: true },
    });

    const agentIds = agents.map(a => a.id);
    const agentMap = new Map(agents.map(a => [a.id, a.name]));

    // Build where clause
    const where: Record<string, unknown> = {
      agentId: { in: agentIds },
    };

    // Filter by specific agent if provided
    if (agentId && agentIds.includes(agentId as string)) {
      where.agentId = agentId;
    }

    // Filter by action type
    if (action) {
      where.action = action;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    // Add agent names
    const logsWithNames = auditLogs.map(log => ({
      ...log,
      agentName: agentMap.get(log.agentId),
    }));

    const total = await prisma.auditLog.count({ where });

    res.json({
      success: true,
      data: logsWithNames,
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

// Get audit log stats
auditRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user's agent IDs
    const agents = await prisma.agent.findMany({
      where: { userId: req.user!.userId },
      select: { id: true },
    });

    const agentIds = agents.map(a => a.id);

    // Get counts by action type
    const logs = await prisma.auditLog.groupBy({
      by: ['action'],
      where: { agentId: { in: agentIds } },
      _count: true,
    });

    const totalLogs = await prisma.auditLog.count({
      where: { agentId: { in: agentIds } },
    });

    // Get recent activity (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.auditLog.count({
      where: {
        agentId: { in: agentIds },
        createdAt: { gte: oneDayAgo },
      },
    });

    res.json({
      success: true,
      data: {
        totalLogs,
        recentActivity,
        byAction: logs.reduce((acc, log) => {
          acc[log.action] = log._count;
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    next(error);
  }
});
