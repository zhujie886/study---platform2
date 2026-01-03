/**
 * 社交平台路由
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  commentPost,
  getComments,
  deleteComment,
  searchPosts,
  favoritePost,
  unfavoritePost,
  getMyFavorites,
  getPostsByUser
} from '../controllers/social.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 动态相关
router.post('/posts', createPost);                    // 发布动态
router.get('/posts', getPosts);                       // 获取动态列表
router.get('/posts/search', searchPosts);             // 搜索动态
router.get('/users/:userId/posts', getPostsByUser);   // 获取指定用户动态
router.get('/posts/:id', getPostById);                // 获取动态详情
router.put('/posts/:id', updatePost);                 // 更新动态
router.delete('/posts/:id', deletePost);              // 删除动态

// 点赞相关
router.post('/posts/:id/like', likePost);             // 点赞
router.delete('/posts/:id/like', unlikePost);         // 取消点赞

// 评论相关
router.post('/posts/:id/comments', commentPost);      // 发表评论
router.get('/posts/:id/comments', getComments);       // 获取评论列表
router.delete('/comments/:commentId', deleteComment); // 删除评论

// 收藏相关
router.post('/posts/:id/favorite', favoritePost);     // 收藏动态
router.delete('/posts/:id/favorite', unfavoritePost); // 取消收藏
router.get('/favorites', getMyFavorites);             // 获取我的收藏

export default router;


