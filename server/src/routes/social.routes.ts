/**
 * Social routes
 */

import { Router } from 'express';
import { authenticateToken, requireNotMuted } from '../middleware/auth.middleware';
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

// All routes require auth
router.use(authenticateToken);

// Posts
router.post('/posts', requireNotMuted, createPost);
router.get('/posts', getPosts);
router.get('/posts/search', searchPosts);
router.get('/users/:userId/posts', getPostsByUser);
router.get('/posts/:id', getPostById);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);

// Likes
router.post('/posts/:id/like', likePost);
router.delete('/posts/:id/like', unlikePost);

// Comments
router.post('/posts/:id/comments', requireNotMuted, commentPost);
router.get('/posts/:id/comments', getComments);
router.delete('/comments/:commentId', deleteComment);

// Favorites
router.post('/posts/:id/favorite', favoritePost);
router.delete('/posts/:id/favorite', unfavoritePost);
router.get('/favorites', getMyFavorites);

export default router;
