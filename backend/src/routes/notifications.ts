
// ============================================
// Notification Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';

export const notificationsRouter = Router();

// All routes require authentication
notificationsRouter.use(authenticate);

// Get all notifications
notificationsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { unreadOnly, limit = '20' } = req.query;

    const where: any = { userId: req.user!.userId };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user!.userId,
        isRead: false
      }
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    next(error);
  }
});

// Mark as read
notificationsRouter.patch('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: { 
        id: req.params.id,
        userId: req.user!.userId 
      },
      data: { isRead: true }
    });

    if (notification.count === 0) {
      return res.status(404).json({ success: false, message: 'الإشعار غير موجود' });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الإشعار'
    });
  } catch (error) {
    next(error);
  }
});

// Mark all as read
notificationsRouter.post('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId },
      data: { isRead: true }
    });

    res.json({
      success: true,
      message: 'تم قراءة جميع الإشعارات'
    });
  } catch (error) {
    next(error);
  }
});
