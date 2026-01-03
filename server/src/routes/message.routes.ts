/**
 * 私信路由
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  sendMessage,
  getConversation,
  getConversationList,
  markAsRead,
  deleteMessage,
  getUnreadCount
} from '../controllers/message.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

router.post('/', sendMessage);                              // 发送私信
router.get('/conversations', getConversationList);         // 获取会话列表
router.get('/conversation/:otherUserId', getConversation); // 获取聊天记录
router.put('/conversation/:otherUserId/read', markAsRead); // 标记已读
router.delete('/:messageId', deleteMessage);               // 删除消息
router.get('/unread/count', getUnreadCount);               // 获取未读数量

export default router;



