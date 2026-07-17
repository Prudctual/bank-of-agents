// ============================================
// Agent API Key Authentication Middleware
// For AI agents to authenticate with the bank
// ============================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { ApiError } from './errorHandler.js';

declare global {
  namespace Express {
    interface Request {
      agent?: {
        id: string;
        name: string;
        userId: string;
        status: string;
      };
    }
  }
}

export const authenticateAgent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const agentKey = req.headers['x-agent-key'] as string;

  if (!agentKey) {
    return next(new ApiError(401, 'مفتاح الوكيل مطلوب'));
  }

  try {
    // Find agent by API key
    const agent = await prisma.agent.findFirst({
      where: { 
        apiKey: agentKey,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        userId: true,
        status: true,
      }
    });

    if (!agent) {
      return next(new ApiError(401, 'مفتاح الوكيل غير صالح أو الوكيل غير نشط'));
    }

    req.agent = agent;
    next();
  } catch (error) {
    return next(new ApiError(500, 'خطأ في التحقق من الوكيل'));
  }
};
