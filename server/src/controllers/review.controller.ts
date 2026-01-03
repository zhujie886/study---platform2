import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const createReview = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: '未授权' });
  }

  // 从前端获取参数 (targetUserId 是多余的，应该从 booking 里查，保证安全)
  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating) {
    return res.status(400).json({ error: '缺少必要参数 (bookingId, rating)' });
  }

  try {
    // 1. 查询预约订单
    // 修复点: 使用 findUnique 查 id，不用 findFirst 拼条件
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({ error: '预约不存在' });
    }

    // 权限校验: 只有发起人 (requesterId) 才能评价
    // 修复点: Schema 中字段是 requesterId，不是 userId
    if (booking.requesterId !== userId) {
      return res.status(403).json({ error: '您无权评价此预定' });
    }

    // 2. 检查是否已评价
    // 修复点: 模型名称是 BookingReview，不是 Review
    const existingReview = await prisma.bookingReview.findUnique({
        where: { bookingId }
    });

    if (existingReview) {
        return res.status(409).json({ error: '您已经评价过此订单' });
    }

    // 3. 创建评价
    // 修复点: 模型 BookingReview; 字段 content 对应 comment
    const review = await prisma.bookingReview.create({
      data: {
        rating: Number(rating),
        content: comment || '', // Schema 中叫 content
        bookingId,
        userId,                 // 评价人
        consultantId: booking.consultantId, // 被评价人 (从订单获取)
      }
    });

    // 4. 计算并更新平均分
    // 修复点: 模型 BookingReview
    const agg = await prisma.bookingReview.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: { consultantId: booking.consultantId },
    });

    // 修复点: ConsultantProfile 字段是 ratingAvg 和 ratingCount
    await prisma.consultantProfile.upsert({
      where: { userId: booking.consultantId },
      update: { 
          ratingAvg: agg._avg.rating || 0,
          ratingCount: agg._count.rating || 0
      },
      create: {
          userId: booking.consultantId,
          ratingAvg: agg._avg.rating || 0,
          ratingCount: agg._count.rating || 0
      }
    });

    res.status(201).json(review);
  } catch (error: any) {
    console.error('Create review error:', error);
    res.status(500).json({ error: '创建评价失败: ' + error.message });
  }
};

