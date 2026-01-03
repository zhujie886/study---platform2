import express from 'express';
import {
  createMemo,
  getMemos,
  getMemoById,
  updateMemo,
  deleteMemo,
  shareMemo,
  searchMemos,
  decryptMemo
} from '../controllers/memo.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 备忘录CRUD
router.post('/', createMemo);
router.get('/', getMemos);
router.get('/search', searchMemos);
router.get('/:id', getMemoById);
router.put('/:id', updateMemo);
router.delete('/:id', deleteMemo);

// 备忘录共享
router.post('/:id/share', shareMemo);

// 解密备忘录
router.post('/:id/decrypt', decryptMemo);

export default router;



