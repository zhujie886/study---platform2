import { Router } from 'express';
import { authenticateToken, isAdmin, optionalAuth } from '../middleware/auth.middleware';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listTags,
  createTag,
  listQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  resolveQuestion,
  reopenQuestion,
  createAnswer,
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
  revokeAccept
} from '../controllers/qa.controller';

const router = Router();

// Categories
router.get('/categories', listCategories);
router.post('/categories', authenticateToken, isAdmin, createCategory);
router.put('/categories/:id', authenticateToken, isAdmin, updateCategory);
router.delete('/categories/:id', authenticateToken, isAdmin, deleteCategory);

// Tags
router.get('/tags', listTags);
router.post('/tags', authenticateToken, createTag);

// Questions
router.get('/questions', listQuestions);
router.post('/questions', authenticateToken, createQuestion);
router.get('/questions/:id', optionalAuth, getQuestionById);
router.put('/questions/:id', authenticateToken, updateQuestion);
router.delete('/questions/:id', authenticateToken, deleteQuestion);
router.post('/questions/:id/resolve', authenticateToken, resolveQuestion);
router.post('/questions/:id/reopen', authenticateToken, reopenQuestion);

// Answers
router.post('/questions/:id/answers', authenticateToken, createAnswer);
router.put('/answers/:id', authenticateToken, updateAnswer);
router.delete('/answers/:id', authenticateToken, deleteAnswer);

// Accept / revoke
router.post('/questions/:id/accept', authenticateToken, acceptAnswer);
router.delete('/questions/:id/accept', authenticateToken, revokeAccept);

export default router;
