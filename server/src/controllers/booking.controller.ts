import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getSocketServer } from '../services/socket.service';

// 工具函数：从请求中读取用户ID（需要 auth 中间件在 req 上挂载 userId）
function getAuthUserId(req: Request): string | null {
	return req.userId || null;
}

// ========== 可预约时段 ==========
export const createSlot = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });

		const { date, startTime, endTime, price } = req.body;
		if (!date || !startTime || !endTime) {
			return res.status(400).json({ error: '日期与时间为必填项' });
		}
		const parsedDate = new Date(date);
		if (Number.isNaN(parsedDate.getTime())) {
			return res.status(400).json({ error: '日期格式不正确' });
		}
		const slot = await prisma.availableSlot.create({
			data: {
				userId,
				date: parsedDate,
				startTime,
				endTime,
				price: Number(price) || 0
			}
		});
		return res.json(slot);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const listMySlots = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const slots = await prisma.availableSlot.findMany({
			where: { userId },
			orderBy: { date: 'asc' }
		});
		return res.json(slots);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const listUserSlots = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const slots = await prisma.availableSlot.findMany({
			where: { userId, isBooked: false },
			orderBy: [{ date: 'asc' }]
		});
		return res.json(slots);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const updateSlot = async (req: Request, res: Response) => {
	try {
		const authUserId = getAuthUserId(req);
		if (!authUserId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params;
		const { date, startTime, endTime, price, isBooked } = req.body;

		// 仅允许本人修改
		const exists = await prisma.availableSlot.findUnique({ where: { id } });
		if (!exists || exists.userId !== authUserId) {
			return res.status(403).json({ error: '无权限或时段不存在' });
		}

		const slot = await prisma.availableSlot.update({
			where: { id },
			data: {
				date: date ? new Date(date) : exists.date,
				startTime: startTime ?? exists.startTime,
				endTime: endTime ?? exists.endTime,
				price: typeof price === 'number' ? price : exists.price,
				isBooked: typeof isBooked === 'boolean' ? isBooked : exists.isBooked
			}
		});
		return res.json(slot);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const deleteSlot = async (req: Request, res: Response) => {
	try {
		const authUserId = getAuthUserId(req);
		if (!authUserId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params;
		const exists = await prisma.availableSlot.findUnique({ where: { id } });
		if (!exists || exists.userId !== authUserId) {
			return res.status(403).json({ error: '无权限或时段不存在' });
		}
		await prisma.availableSlot.delete({ where: { id } });
		return res.json({ success: true });
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

// ========== 预约 ==========
export const createBooking = async (req: Request, res: Response) => {
	try {
		const requesterId = getAuthUserId(req);
		if (!requesterId) return res.status(401).json({ error: '未授权' });
		const { slotId, purpose, duration, skill } = req.body;

		if (!skill || !skill.trim()) {
			return res.status(400).json({ error: '请选择预约技能' });
		}

		const slot = await prisma.availableSlot.findUnique({ where: { id: slotId } });
		if (!slot || slot.isBooked) return res.status(400).json({ error: '时段不可用' });

		const booking = await prisma.booking.create({
			data: {
				slotId,
				requesterId,
				consultantId: slot.userId,
				skill: skill.trim(),
				purpose,
				duration: Number(duration) || 60,
				amount: slot.price,
				status: 'pending'
			},
			include: { slot: true }
		});

		// 标记时段占用中
		await prisma.availableSlot.update({ where: { id: slotId }, data: { isBooked: true } });

		// 实时通知咨询师
		try {
			getSocketServer().emit('booking-request-received', booking);
		} catch {}

		return res.json(booking);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const listMyBookings = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const bookings = await prisma.booking.findMany({
			where: { OR: [{ requesterId: userId }, { consultantId: userId }] },
			orderBy: { createdAt: 'desc' }
		});
		return res.json(bookings);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const updateBookingStatus = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params;
		const { action } = req.body as { action: 'confirm' | 'cancel' | 'complete' };

		const booking = await prisma.booking.findUnique({ where: { id } });
		if (!booking) return res.status(404).json({ error: '预约不存在' });
		if (booking.consultantId !== userId && booking.requesterId !== userId) {
			return res.status(403).json({ error: '无权限' });
		}

		let status = booking.status;
		if (action === 'confirm' && userId === booking.consultantId) status = 'confirmed';
		if (action === 'cancel') status = 'cancelled';
		if (action === 'complete') status = 'completed';

		const updated = await prisma.booking.update({
			where: { id },
			data: { status }
		});
		return res.json(updated);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

// ========== 支付（对接现有 payment.service 的模拟支付） ==========
export const payForBooking = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params;

		const booking = await prisma.booking.findUnique({ where: { id } });
		if (!booking) return res.status(404).json({ error: '预约不存在' });
		if (booking.requesterId !== userId) return res.status(403).json({ error: '仅预约人可付款' });

		// 创建支付记录（此处调用支付网关可替换为真实支付）
		const payment = await prisma.payment.create({
			data: {
				bookingId: booking.id,
				payerId: userId,
				payeeId: booking.consultantId,
				amount: booking.amount ?? undefined,
				status: 'success',
				paymentMethod: 'simulate',
				transactionId: `MOCK-${Date.now()}`
			}
		});

		// 更新预约状态
		const updated = await prisma.booking.update({ where: { id }, data: { status: 'confirmed' } });
		return res.json({ booking: updated, payment });
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

// ========== 会议房间挂载到预约 ==========
export const attachRoom = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params; // bookingId
		const { title, password } = req.body;

		const booking = await prisma.booking.findUnique({ where: { id } });
		if (!booking) return res.status(404).json({ error: '预约不存在' });
		if (booking.consultantId !== userId) return res.status(403).json({ error: '仅咨询师可创建会议' });

		const room = await prisma.videoRoom.create({
			data: {
				hostId: userId,
				roomNumber: `${Date.now()}`,
				title: title || '咨询会议',
				password: password || null,
				status: 'scheduled',
				enableWhiteboard: true,
				enableScreenShare: true
			}
		});

		const updated = await prisma.booking.update({ where: { id }, data: { roomId: room.id } });
		return res.json({ booking: updated, room });
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

// ========== 评价系统 ==========

/**
 * 创建预约评价
 */
export const createReview = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { bookingId, rating, content, images } = req.body;

		const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
		if (!booking) return res.status(404).json({ error: '预约不存在' });
		if (booking.requesterId !== userId) return res.status(403).json({ error: '仅预约人可评价' });
		if (booking.status !== 'completed') return res.status(400).json({ error: '仅已完成的预约可评价' });

		const review = await prisma.bookingReview.create({
			data: {
				bookingId,
				userId,
				consultantId: booking.consultantId,
				rating: Number(rating),
				content: content || '',
				images: images ? JSON.stringify(images) : null
			}
		});

		// 更新预约状态
		await prisma.booking.update({ where: { id: bookingId }, data: { status: 'reviewed' } });

		return res.json(review);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

/**
 * 获取用户的评价列表（作为咨询师收到的评价）
 */
export const getReviewsByUserId = async (req: Request, res: Response) => {
	try {
		const { userId } = req.params;
		const { page = '1', limit = '20' } = req.query;

		const pageNum = parseInt(page as string);
		const limitNum = parseInt(limit as string);

		const [reviews, total] = await Promise.all([
			prisma.bookingReview.findMany({
				where: { consultantId: userId },
				include: {
					user: {
						select: {
							id: true,
							username: true,
							avatar: true
						}
					}
				},
				skip: (pageNum - 1) * limitNum,
				take: limitNum,
				orderBy: { createdAt: 'desc' }
			}),
			prisma.bookingReview.count({ where: { consultantId: userId } })
		]);

		const reviewsWithImages = reviews.map(review => ({
			...review,
			images: review.images ? JSON.parse(review.images) : []
		}));

		return res.json({
			data: reviewsWithImages,
			pagination: {
				page: pageNum,
				limit: limitNum,
				total,
				totalPages: Math.ceil(total / limitNum)
			}
		});
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

/**
 * 咨询师回复评价
 */
export const replyReview = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id: reviewId } = req.params;
		const { reply } = req.body;

		const review = await prisma.bookingReview.findUnique({ where: { id: reviewId } });
		if (!review) return res.status(404).json({ error: '评价不存在' });
		if (review.consultantId !== userId) return res.status(403).json({ error: '仅被评价人可回复' });

		const updated = await prisma.bookingReview.update({
			where: { id: reviewId },
			data: { reply }
		});

		return res.json(updated);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};


