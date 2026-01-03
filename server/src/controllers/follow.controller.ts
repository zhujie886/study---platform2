/**
 * 关注系统控制器
 * 实现用户关注、取消关注、查询关注列表等功能
 */

import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * 关注用户
 */
export const followUser = async (req: Request, res: Response) => {
  try {
    const followerId = req.userId!;
    const { userId: followingId } = req.params;

    if (followerId === followingId) {
      return res.status(400).json({ error: '不能关注自己' });
    }

    // 检查是否已关注
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: '已经关注过该用户' });
    }

    const follow = await prisma.follow.create({
      data: {
        followerId,
        followingId
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true
          }
        }
      }
    });

    res.status(201).json(follow);
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: '关注失败' });
  }
};

/**
 * 取消关注
 */
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const followerId = req.userId!;
    const { userId: followingId } = req.params;

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    res.json({ message: '已取消关注' });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: '取消关注失败' });
  }
};

/**
 * 获取关注列表
 */
export const getFollowing = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isConsultant: true
          }
        }
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.follow.count({
      where: { followerId: userId }
    });

    res.json({
      data: following.map(f => f.following),
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: '获取关注列表失败' });
  }
};

/**
 * 获取粉丝列表
 */
export const getFollowers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { page = '1', limit = '20' } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isConsultant: true
          }
        }
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.follow.count({
      where: { followingId: userId }
    });

    res.json({
      data: followers.map(f => f.follower),
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: '获取粉丝列表失败' });
  }
};

/**
 * 检查关注状态
 */
export const checkFollowStatus = async (req: Request, res: Response) => {
  try {
    const followerId = req.userId!;
    const { userId: followingId } = req.params;

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Check follow status error:', error);
    res.status(500).json({ error: '检查关注状态失败' });
  }
};

/**
 * 获取用户统计信息
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const [followingCount, followersCount, postsCount] = await Promise.all([
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.post.count({ where: { userId } })
    ]);

    res.json({
      followingCount,
      followersCount,
      postsCount
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: '获取用户统计失败' });
  }
};

/**
 * 搜索用户
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q, page = '1', limit = '20' } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: '请输入搜索关键词' });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: q } },
          { bio: { contains: q } }
        ]
      },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        isConsultant: true
      },
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    });

    const total = await prisma.user.count({
      where: {
        OR: [
          { username: { contains: q } },
          { bio: { contains: q } }
        ]
      }
    });

    res.json({
      data: users,
      total,
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: '搜索用户失败' });
  }
};


