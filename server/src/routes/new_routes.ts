import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import {
  updateProfile,
  getConsultantPublic,
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  addAvailabilityRule,
  listAvailabilityRules,
  deleteAvailabilityRule
} from '../controllers/consultant.controller';
import {
  createBooking,
  simulatePayment,
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
  startMeeting,
  endMeeting
} from '../controllers/order.controller';

const router = Router();

// Consultant profile
router.put('/consultant/profile', authenticateToken, updateProfile);
router.get('/consultant/:id', getConsultantPublic);

// Services
router.post('/services', authenticateToken, createService);
router.get('/services', getServices);
router.get('/services/:id', getServiceById);
router.put('/services/:id', authenticateToken, updateService);
router.delete('/services/:id', authenticateToken, deleteService);

// Availability rules
router.post('/availability-rules', authenticateToken, addAvailabilityRule);
router.get('/availability-rules', authenticateToken, listAvailabilityRules);
router.delete('/availability-rules/:id', authenticateToken, deleteAvailabilityRule);

// Booking (pending full implementation)
router.post('/bookings', authenticateToken, createBooking);
router.post('/bookings/pay', authenticateToken, simulatePayment);
router.get('/bookings/my', authenticateToken, getMyBookings);
router.post('/bookings/:id/cancel', authenticateToken, cancelBooking);
router.post('/bookings/:id/reschedule', authenticateToken, rescheduleBooking);
router.post('/bookings/:id/start', authenticateToken, startMeeting);
router.post('/bookings/:id/end', authenticateToken, endMeeting);

export default router;
