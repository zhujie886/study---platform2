import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs'; // 确保安装了 bcryptjs
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();
const ADMIN_KEY = process.env.ADMIN_KEY || '123456';
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';

// 管理员登录
export const adminLogin = (req: Request, res: Response) => {
  const { key } = req.body;
  if (key === ADMIN_KEY) {
    // 颁发 token
    const token = jwt.sign({ role: 'admin', userId: 'admin' }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, message: '登录成功' });
  } else {
    res.status(401).json({ error: '密钥不正确' });
  }
};

// 获取仪表盘统计
export const getDashboardStats = async (req: Request, res: Response) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalMemos = await prisma.memo.count();
        const totalMeetings = await prisma.videoRoom.count();
        const totalPosts = await prisma.post.count();
        res.json({ totalUsers, totalMemos, totalMeetings, totalPosts });
    } catch (e) { res.status(500).json({ error: '获取统计失败' }); }
};

// 获取所有用户
export const getAllUsers = async (req: Request, res: Response) => {
    const { search } = req.query;
    const where: any = {};
    if (search) where.username = { contains: String(search) };
    const users = await prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
    res.json(users);
};

// 删除用户
export const deleteUser = async (req: Request, res: Response) => { 
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
};

// [新增] 获取所有备忘录 (Admin)
export const getAllMemos = async (req: Request, res: Response) => {
    const memos = await prisma.memo.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: true } });
    res.json(memos); 
};

// [新增] 获取所有会议 (Admin)
export const getAllMeetings = async (req: Request, res: Response) => {
    const meetings = await prisma.videoRoom.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { host: true } });
    res.json(meetings);
};

// [新增] 获取所有帖子 (Admin)
export const getAllPosts = async (req: Request, res: Response) => {
    const posts = await prisma.post.findMany({ take: 20, orderBy: { createdAt: 'desc' }, include: { user: true } });
    res.json(posts);
};

export const deletePost = async (req: Request, res: Response) => {
    await prisma.post.delete({ where: { id: req.params.id } });
    res.status(204).send();
};

export const updateUser = async (req: Request, res: Response) => { res.json({}) };

