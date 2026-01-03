import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { createReview } from '../controllers/review.controller';

const router = Router();

router.post('/', authenticateToken, createReview);

export default router;

