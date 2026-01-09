/**
 * Message routes
 */

import { Router } from 'express';
import { authenticateToken, requireNotMuted } from '../middleware/auth.middleware';
import {
  sendMessage,
  getConversation,
  getConversationList,
  markAsRead,
  deleteMessage,
  getUnreadCount
} from '../controllers/message.controller';

const router = Router();

// All routes require auth
router.use(authenticateToken);

router.post('/', requireNotMuted, sendMessage);
router.get('/conversations', getConversationList);
router.get('/conversation/:otherUserId', getConversation);
router.put('/conversation/:otherUserId/read', markAsRead);
router.delete('/:messageId', deleteMessage);
router.get('/unread/count', getUnreadCount);

export default router;
