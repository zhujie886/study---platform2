import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

/**
 * 用户注册
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    // 验证必填字段
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username and password are required' });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true
      }
    });

    // 生成JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * 用户登录
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 验证必填字段
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // 查找用户
    const identifier = String(email).trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 验证密码
    let isPasswordValid = await bcrypt.compare(password, user.password);
    // 兼容旧数据库：如果历史数据是明文密码，则自动升级为 bcrypt hash
    if (!isPasswordValid && user.password === password) {
      const upgradedHash = await bcrypt.hash(password, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: upgradedHash } });
      isPasswordValid = true;
    }
if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * 获取用户信息
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

/**
 * 更新用户信息
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { username, avatar } = req.body;

    const updateData: any = {};
    if (username) updateData.username = username;
    if (avatar !== undefined) updateData.avatar = avatar;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * 获取指定用户信息（用于个人主页、预约系统）
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatar: true,
        bio: true,
        isConsultant: true,
        isVerified: true,
        specialties: true,
        pricingRules: true,
        weeklySchedule: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 获取用户统计数据
    const [totalBookings, completedBookings, avgRating, reviewCount, positiveReviewCount] = await Promise.all([
      prisma.booking.count({
        where: { consultantId: userId }
      }),
      prisma.booking.count({
        where: {
          consultantId: userId,
          status: 'completed'
        }
      }),
      prisma.bookingReview.aggregate({
        where: { consultantId: userId },
        _avg: { rating: true }
      }),
      prisma.bookingReview.count({
        where: { consultantId: userId }
      }),
      prisma.bookingReview.count({
        where: {
          consultantId: userId,
          rating: { gte: 4 }
        }
      })
    ]);

    const bookingRate = totalBookings > 0 ? completedBookings / totalBookings : 0;
    const positiveRate = reviewCount > 0 ? positiveReviewCount / reviewCount : 0;

    res.json({
      ...user,
      specialties: user.specialties ? JSON.parse(user.specialties) : [],
      pricingRules: user.pricingRules ? JSON.parse(user.pricingRules) : [],
      weeklySchedule: user.weeklySchedule ? JSON.parse(user.weeklySchedule) : null,
      totalBookings,
      completedBookings,
      bookingRate,
      reviewCount,
      positiveReviewCount,
      positiveRate,
      rating: avgRating._avg.rating || 0
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
};


