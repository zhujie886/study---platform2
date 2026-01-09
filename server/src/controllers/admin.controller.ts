import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();
const ADMIN_KEY = process.env.ADMIN_KEY || '13456';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

export const adminLogin = (req: Request, res: Response) => {
  const { key } = req.body;
  if (key === ADMIN_KEY) {
    const token = jwt.sign({ role: 'admin', userId: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, message: 'login success' });
  }

  return res.status(401).json({ error: 'invalid admin key' });
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalMemos,
      totalMeetings,
      totalPosts,
      totalComments,
      totalQuestions,
      totalAnswers,
      totalMessages,
      totalBarrages,
      mutedUsers,
      newUsers7d,
      newPosts7d,
      newComments7d,
      newQuestions7d,
      newAnswers7d,
      newMessages7d,
      newBarrages7d,
      newMeetings7d,
      newMemos7d
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.memo.count(),
      prisma.videoRoom.count(),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.question.count(),
      prisma.answer.count(),
      prisma.message.count(),
      prisma.barrage.count(),
      prisma.user.count({
        where: {
          isMuted: true,
          OR: [{ mutedUntil: null }, { mutedUntil: { gt: now } }]
        }
      }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.post.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.comment.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.question.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.answer.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.message.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.barrage.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.videoRoom.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.memo.count({ where: { createdAt: { gte: sevenDaysAgo } } })
    ]);

    return res.json({
      totals: {
        users: totalUsers,
        memos: totalMemos,
        meetings: totalMeetings,
        posts: totalPosts,
        comments: totalComments,
        questions: totalQuestions,
        answers: totalAnswers,
        messages: totalMessages,
        barrages: totalBarrages,
        mutedUsers
      },
      last7d: {
        users: newUsers7d,
        posts: newPosts7d,
        comments: newComments7d,
        questions: newQuestions7d,
        answers: newAnswers7d,
        messages: newMessages7d,
        barrages: newBarrages7d,
        meetings: newMeetings7d,
        memos: newMemos7d
      }
    });
  } catch (e) {
    return res.status(500).json({ error: 'failed to load stats' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const { search } = req.query;
  const where: any = {};
  if (search) where.username = { contains: String(search) };
  const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
  return res.json(users);
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isMuted, mutedUntil, muteReason } = req.body || {};

    const data: any = {};
    if (typeof isMuted === 'boolean') data.isMuted = isMuted;
    if (mutedUntil !== undefined) {
      data.mutedUntil = mutedUntil ? new Date(mutedUntil) : null;
    }
    if (muteReason !== undefined) data.muteReason = muteReason || null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'no fields to update' });
    }

    const updated = await prisma.user.update({ where: { id }, data });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ error: 'update failed' });
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const raw = req.body?.password ?? req.body?.newPassword;
    const password = typeof raw === 'string' ? raw.trim() : '';

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'password too short' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updated = await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    return res.json({ ok: true, userId: updated.id });
  } catch (error) {
    return res.status(500).json({ error: 'reset password failed' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  return res.status(204).send();
};

export const muteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { days, until, reason } = req.body || {};

    let mutedUntil: Date | null = null;
    if (until) {
      const parsed = new Date(until);
      mutedUntil = Number.isNaN(parsed.getTime()) ? null : parsed;
    } else if (days !== undefined && days !== null && String(days).trim() !== '') {
      const daysNum = Number(days);
      if (!Number.isNaN(daysNum) && daysNum > 0) {
        mutedUntil = new Date(Date.now() + daysNum * 24 * 60 * 60 * 1000);
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        isMuted: true,
        mutedUntil,
        muteReason: reason || null,
        mutedAt: new Date(),
        mutedBy: (req as any).user?.userId || 'admin'
      }
    });

    return res.json({ ok: true, user: updated });
  } catch (error) {
    return res.status(500).json({ error: 'mute failed' });
  }
};

export const unmuteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = await prisma.user.update({
      where: { id },
      data: { isMuted: false, mutedUntil: null, muteReason: null, mutedAt: null, mutedBy: null }
    });
    return res.json({ ok: true, user: updated });
  } catch (error) {
    return res.status(500).json({ error: 'unmute failed' });
  }
};

export const getAllMemos = async (_req: Request, res: Response) => {
  const memos = await prisma.memo.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: true } });
  return res.json(memos);
};

export const getAllMeetings = async (_req: Request, res: Response) => {
  const meetings = await prisma.videoRoom.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { host: true } });
  return res.json(meetings);
};

export const getAllPosts = async (_req: Request, res: Response) => {
  const posts = await prisma.post.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: true } });
  return res.json(posts);
};

export const deletePost = async (req: Request, res: Response) => {
  await prisma.post.delete({ where: { id: req.params.id } });
  return res.status(204).send();
};
