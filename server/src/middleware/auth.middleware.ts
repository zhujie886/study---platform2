import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import prisma from '../utils/prisma';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ Auth Middleware: No token provided');
    return res.status(401).json({ error: '需要登录才能操作' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      console.log('❌ Auth Middleware: Invalid token', err.message);
      // 返回 403 触发前端 API 拦截器的自动退出逻辑
      return res.status(403).json({ error: '登录已过期，请重新登录' });
    }

    req.user = decoded;
    req.userId = decoded.userId || decoded.id; 

    if (!req.userId) {
        console.error('❌ Auth Middleware: Token decoded but no userId found!', decoded);
        // 返回 403 触发前端自动退出
        return res.status(403).json({ error: '无效的令牌结构' });
    }

    next();
  });
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: '需要管理员权限' });
    }
};

export const requireNotMuted = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: '需要登录才能操作' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isMuted: true, mutedUntil: true, muteReason: true }
    });

    if (!user?.isMuted) {
      return next();
    }

    const now = new Date();
    if (user.mutedUntil && user.mutedUntil <= now) {
      await prisma.user.update({
        where: { id: userId },
        data: { isMuted: false, mutedUntil: null, muteReason: null, mutedAt: null, mutedBy: null }
      });
      return next();
    }

    return res.status(423).json({
      error: 'muted',
      message: '你已被禁言，暂时无法发布内容',
      mutedUntil: user.mutedUntil,
      reason: user.muteReason
    });
  } catch (error) {
    console.error('Mute check failed:', error);
    return res.status(500).json({ error: '禁言状态检查失败' });
  }
};


export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (!err && decoded) {
      req.user = decoded;
      req.userId = decoded.userId || decoded.id;
    }
    next();
  });
};
