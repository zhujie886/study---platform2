import { Router } from 'express';
import {
  adminLogin,
  getAllUsers,
  getDashboardStats,
  deleteUser,
  updateUser,
  resetUserPassword,
  muteUser,
  unmuteUser,
  getAllMemos,
  getAllMeetings,
  getAllPosts,
  deletePost
} from '../controllers/admin.controller';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware';
import { getAdminLogs } from '../controllers/logs.controller';

const router = Router();

router.post('/login', adminLogin);

router.use(authenticateToken, isAdmin); // 下面的路由全部需要管理员权限

router.get('/stats', getDashboardStats);
router.get('/logs', getAdminLogs);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.patch('/users/:id/password', resetUserPassword);
router.patch('/users/:id/mute', muteUser);
router.patch('/users/:id/unmute', unmuteUser);
router.delete('/users/:id', deleteUser);

// 新增路由
router.get('/memos', getAllMemos);
router.get('/meetings', getAllMeetings);
router.get('/posts', getAllPosts);
router.delete('/posts/:id', deletePost);

export default router;


