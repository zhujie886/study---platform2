import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createBreakoutRoom, listBreakoutRooms, setBreakoutMembers, endBreakoutRoom } from '../controllers/breakout.controller';

const router = express.Router();

router.post('/', authenticateToken, createBreakoutRoom);
router.get('/main/:mainRoomId', authenticateToken, listBreakoutRooms);
router.put('/:id/members', authenticateToken, setBreakoutMembers);
router.post('/:id/end', authenticateToken, endBreakoutRoom);

export default router;




