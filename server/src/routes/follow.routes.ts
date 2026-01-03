/**
 * 关注系统路由
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  checkFollowStatus,
  getUserStats,
  searchUsers
} from '../controllers/follow.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 用户搜索
router.get('/users/search', searchUsers);                  // 搜索用户

// 关注操作
router.post('/users/:userId/follow', followUser);          // 关注用户
router.delete('/users/:userId/follow', unfollowUser);      // 取消关注
router.get('/users/:userId/follow/status', checkFollowStatus); // 检查关注状态

// 关注列表
router.get('/users/:userId/following', getFollowing);      // 获取关注列表
router.get('/users/:userId/followers', getFollowers);      // 获取粉丝列表

// 用户统计
router.get('/users/:userId/stats', getUserStats);          // 获取用户统计

export default router;



