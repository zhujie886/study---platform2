import { Router } from 'express';
import { authenticateToken, requireNotMuted } from '../middleware/auth.middleware';
import {
  createMeetingWithLink,
  joinByLink,
  sendMeetingInvitation,
  respondToInvitation,
  getMyInvitations,
  sendBarrage,
  revokeBarrage,
  pinBarrage,
  getRoomBarrages,
  grantWhiteboardPermission,
  revokeWhiteboardPermission,
  setWhiteboardPublicEdit
} from '../controllers/meeting.controller';

const router = Router();

router.use(authenticateToken);

router.post('/create-with-link', createMeetingWithLink);
router.post('/join/:inviteLink', joinByLink);

router.post('/invitations/send', sendMeetingInvitation);
router.put('/invitations/:invitationId/respond', respondToInvitation);
router.get('/invitations/my', getMyInvitations);

router.post('/barrages', requireNotMuted, sendBarrage);
router.delete('/barrages/:barrageId', revokeBarrage);
router.put('/barrages/:barrageId/pin', pinBarrage);
router.get('/rooms/:roomId/barrages', getRoomBarrages);

router.post('/whiteboard/grant', grantWhiteboardPermission);
router.post('/whiteboard/revoke', revokeWhiteboardPermission);
router.post('/whiteboard/public-edit', setWhiteboardPublicEdit);

export default router;
