import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// 基础认证
router.post('/register', register);
router.post('/login', login);

// 用户资料 (需要登录)
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);

export default router;
