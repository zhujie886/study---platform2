import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { io } from '../index';

const buildRoomNumber = () => `ROOM-${Date.now()}`;

const RESCHEDULE_LIMIT = 1;
const RESCHEDULE_CUTOFF_HOURS = 6;
const REFUND_FULL_HOURS = 24;
const REFUND_PARTIAL_HOURS = 2;
const REFUND_PARTIAL_RATE = 0.7;
const REFUND_LATE_RATE = 0.2;
const READY_WINDOW_MINUTES = 10;

const hoursBetween = (future: Date | null | undefined, base: Date) => {
  if (!future) return null;
  const diffMs = future.getTime() - base.getTime();
  return diffMs / (1000 * 60 * 60);
};

const calculateRefundRate = (hoursUntil: number | null, isConsultantCancel: boolean) => {
  if (isConsultantCancel) return 1;
  if (hoursUntil === null) return 0;
  if (hoursUntil >= REFUND_FULL_HOURS) return 1;
  if (hoursUntil >= REFUND_PARTIAL_HOURS) return REFUND_PARTIAL_RATE;
  return REFUND_LATE_RATE;
};

// Create booking from a service package
export const createBooking = async (req: Request, res: Response) => {
  try {
    const requesterId = req.userId!;
    const { serviceId, startAt, questionText } = req.body;

    if (!serviceId || !startAt) {
      return res.status(400).json({ error: 'serviceId/startAt 必填' });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: { consultant: true }
    });
    if (!service || !service.isActive) return res.status(404).json({ error: '服务不存在或已下架' });

    const startDate = new Date(startAt);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'startAt 时间格式不正确' });
    }
    const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

    const conflict = await prisma.booking.findFirst({
      where: {
        consultantId: service.consultantId,
        status: { in: ['pending_payment', 'paid', 'ready', 'in_progress', 'completed'] },
        OR: [
          { startAt: { lte: startDate }, endAt: { gt: startDate } },
          { startAt: { lt: endDate }, endAt: { gte: endDate } }
        ]
      }
    });
    if (conflict) return res.status(409).json({ error: '该时段已被预约' });

    const normalizedQuestion = questionText ? String(questionText).trim() : '';
    const booking = await prisma.booking.create({
      data: {
        requesterId,
        consultantId: service.consultantId,
        serviceId,
        startAt: startDate,
        endAt: endDate,
        questionText: normalizedQuestion || null,
        skill: service.title,
        purpose: normalizedQuestion || service.scope || '服务预约',
        duration: service.durationMinutes,
        amount: service.price,
        status: 'pending_payment'
      }
    });

    const platformFee = service.price * 0.1;
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        payerId: requesterId,
        payeeId: service.consultantId,
        amount: service.price,
        grossAmount: service.price,
        netAmount: service.price - platformFee,
        status: 'pending'
      }
    });

    io.to(`user-${service.consultantId}`).emit('booking:request_created', booking);
    res.status(201).json(booking);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Simulate payment and create meeting room if needed
export const simulatePayment = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    const userId = req.userId!;

    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    if (!payment) return res.status(404).json({ error: '支付单不存在' });
    if (payment.payerId !== userId) return res.status(403).json({ error: '无权支付' });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true }
    });
    if (!booking) return res.status(404).json({ error: '订单不存在' });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'success', paidAt: new Date(), transactionId: `SIM-${Date.now()}` }
    });

    let roomId: string | undefined;
    const service = booking.service;
    if (service && service.deliveryType === 'meeting') {
      const room = await prisma.videoRoom.create({
        data: {
          hostId: booking.consultantId,
          roomNumber: buildRoomNumber(),
          title: service.title ? `${service.title} 会议` : '咨询会议',
          status: 'scheduled',
          scheduledAt: booking.startAt ?? undefined,
          enableWhiteboard: true,
          enableScreenShare: true
        }
      });
      roomId = room.id;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'paid',
        ...(roomId ? { roomId } : {})
      }
    });

    io.to(`user-${updated.consultantId}`).emit('booking:confirmed', updated);
    io.to(`user-${updated.requesterId}`).emit('booking:confirmed', updated);

    res.json({ success: true, booking: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Cancel booking with refund rules
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: true }
    });
    if (!booking) return res.status(404).json({ error: '订单不存在' });
    if (booking.requesterId !== userId && booking.consultantId !== userId) {
      return res.status(403).json({ error: '无权限取消该订单' });
    }
    if (['cancelled', 'refunded'].includes(booking.status)) {
      return res.status(400).json({ error: '订单已取消' });
    }
    if (['in_progress', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: '订单已开始或完成，无法取消' });
    }

    const now = new Date();
    const hoursUntil = hoursBetween(booking.startAt ?? null, now);
    if (hoursUntil !== null && hoursUntil <= 0) {
      return res.status(400).json({ error: '订单已开始，无法取消' });
    }

    const isConsultantCancel = booking.consultantId === userId;
    const cancelReason = String(reason || '').trim() || (isConsultantCancel ? 'consultant_cancelled' : 'user_cancelled');

    if (booking.status === 'pending_payment') {
      if (booking.payment) {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: { status: 'cancelled' }
        });
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelReason: cancelReason,
          refundAmount: 0
        }
      });

      return res.json({ booking: updated, refundAmount: 0 });
    }

    if (booking.status !== 'paid') {
      return res.status(400).json({ error: '当前状态不可取消' });
    }

    const refundRate = calculateRefundRate(hoursUntil, isConsultantCancel);
    const refundAmount = Math.round(booking.amount * refundRate * 100) / 100;
    const nextStatus = refundAmount > 0 ? 'refunded' : 'cancelled';

    if (booking.payment) {
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: { status: refundAmount > 0 ? 'refunded' : 'cancelled' }
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: nextStatus,
        cancelReason: cancelReason,
        refundAmount
      }
    });

    if (booking.roomId) {
      await prisma.videoRoom.update({
        where: { id: booking.roomId },
        data: { status: 'cancelled' }
      });
    }

    return res.json({ booking: updated, refundAmount });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Reschedule booking time
export const rescheduleBooking = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { startAt } = req.body;

    if (!startAt) {
      return res.status(400).json({ error: 'startAt 必填' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true }
    });
    if (!booking) return res.status(404).json({ error: '订单不存在' });
    if (booking.requesterId !== userId && booking.consultantId !== userId) {
      return res.status(403).json({ error: '无权限改期' });
    }
    if (!['pending_payment', 'paid'].includes(booking.status)) {
      return res.status(400).json({ error: '当前状态不可改期' });
    }
    if (booking.rescheduleCount >= RESCHEDULE_LIMIT) {
      return res.status(400).json({ error: '已超过改期次数限制' });
    }

    const now = new Date();
    const currentHoursUntil = hoursBetween(booking.startAt ?? null, now);
    if (currentHoursUntil !== null && currentHoursUntil < RESCHEDULE_CUTOFF_HOURS) {
      return res.status(400).json({ error: `已超过改期截止时间（需提前${RESCHEDULE_CUTOFF_HOURS}小时）` });
    }

    const newStart = new Date(startAt);
    if (Number.isNaN(newStart.getTime())) {
      return res.status(400).json({ error: 'startAt 时间格式不正确' });
    }
    const newHoursUntil = hoursBetween(newStart, now);
    if (newHoursUntil !== null && newHoursUntil < RESCHEDULE_CUTOFF_HOURS) {
      return res.status(400).json({ error: `预约时间需至少提前${RESCHEDULE_CUTOFF_HOURS}小时` });
    }

    const durationMinutes = booking.service?.durationMinutes ?? booking.duration;
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

    const conflict = await prisma.booking.findFirst({
      where: {
        consultantId: booking.consultantId,
        id: { not: booking.id },
        status: { in: ['pending_payment', 'paid', 'ready', 'in_progress', 'completed'] },
        OR: [
          { startAt: { lte: newStart }, endAt: { gt: newStart } },
          { startAt: { lt: newEnd }, endAt: { gte: newEnd } }
        ]
      }
    });
    if (conflict) return res.status(409).json({ error: '新时段已被预约' });

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        startAt: newStart,
        endAt: newEnd,
        rescheduleCount: { increment: 1 }
      }
    });

    if (booking.roomId) {
      await prisma.videoRoom.update({
        where: { id: booking.roomId },
        data: { scheduledAt: newStart }
      });
    }

    res.json({ booking: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Start meeting (consultant only)
export const startMeeting = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: '订单不存在' });
    if (booking.consultantId !== userId) {
      return res.status(403).json({ error: '仅咨询师可开始会议' });
    }
    if (!['paid', 'ready'].includes(booking.status)) {
      return res.status(400).json({ error: '当前状态不可开始会议' });
    }
    if (!booking.roomId) {
      return res.status(400).json({ error: '未创建会议房间' });
    }

    const now = new Date();
    const hoursUntil = hoursBetween(booking.startAt ?? null, now);
    if (hoursUntil !== null && hoursUntil > (READY_WINDOW_MINUTES / 60)) {
      return res.status(400).json({ error: '尚未到可开始时间' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'in_progress',
        startedAt: now
      }
    });

    await prisma.videoRoom.update({
      where: { id: booking.roomId },
      data: { status: 'active', startedAt: now }
    });

    res.json({ booking: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// End meeting (consultant only)
export const endMeeting = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: '订单不存在' });
    if (booking.consultantId !== userId) {
      return res.status(403).json({ error: '仅咨询师可结束会议' });
    }
    if (!['in_progress', 'ready', 'paid'].includes(booking.status)) {
      return res.status(400).json({ error: '当前状态不可结束会议' });
    }

    const now = new Date();
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: now
      }
    });

    if (booking.roomId) {
      await prisma.videoRoom.update({
        where: { id: booking.roomId },
        data: { status: 'ended', endedAt: now }
      });
    }

    res.json({ booking: updated });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// List my bookings (as requester or consultant)
export const getMyBookings = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ requesterId: userId }, { consultantId: userId }]
      },
      include: { service: true, payment: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json(bookings);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
