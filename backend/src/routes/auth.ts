// ============================================
// Authentication Routes
// ============================================

import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../middleware/errorHandler.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();

// Register
authRouter.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      throw new ApiError(400, 'جميع الحقول مطلوبة');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, 'البريد الإلكتروني مستخدم بالفعل');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with wallet
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        wallet: {
          create: {
            balance: 100, // رصيد ترحيبي
            currency: 'USD',
          },
        },
      },
      include: {
        wallet: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        wallet: user.wallet,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'البريد الإلكتروني وكلمة المرور مطلوبان');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { wallet: true },
    });

    if (!user) {
      throw new ApiError(401, 'بيانات الدخول غير صحيحة');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new ApiError(401, 'بيانات الدخول غير صحيحة');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        wallet: user.wallet,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { 
        wallet: true,
        agents: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'المستخدم غير موجود');
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        wallet: user.wallet,
        agents: user.agents,
      },
    });
  } catch (error) {
    next(error);
  }
});
