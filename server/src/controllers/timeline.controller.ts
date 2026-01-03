import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { io } from '../index';

/**
 * 创建时间表
 */
export const createTimeline = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { date, timeBlocks = [], tasks = [] } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // 检查是否已存在
    const existing = await prisma.timeline.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Timeline for this date already exists' });
    }

    // 计算时间利用率和统计数据
    const { utilizationRate, totalWorkTime, statistics } = calculateTimeStats(timeBlocks);

    const timeline = await prisma.timeline.create({
      data: {
        userId,
        date: new Date(date),
        timeBlocks: JSON.stringify(timeBlocks),
        tasks: JSON.stringify(tasks),
        utilizationRate,
        totalWorkTime,
        statistics: JSON.stringify(statistics)
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    });

    io.to(`user-${userId}`).emit('timeline:created', timeline);

    res.status(201).json(timeline);
  } catch (error) {
    console.error('Create timeline error:', error);
    res.status(500).json({ error: 'Failed to create timeline' });
  }
};

/**
 * 获取时间表列表
 */
export const getTimelines = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    const where: any = { userId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const timelines = await prisma.timeline.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 30
    });

    res.json(timelines);
  } catch (error) {
    console.error('Get timelines error:', error);
    res.status(500).json({ error: 'Failed to fetch timelines' });
  }
};

/**
 * 获取指定日期的时间表
 */
export const getTimelineByDate = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { date } = req.params;

    const timeline = await prisma.timeline.findUnique({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      }
    });

    if (!timeline) {
      // 如果不存在，返回空模板
      return res.json({
        date: new Date(date),
        timeBlocks: [],
        tasks: [],
        utilizationRate: 0,
        totalWorkTime: 0,
        statistics: { work: 0, study: 0, rest: 0, meeting: 0 }
      });
    }

    res.json(timeline);
  } catch (error) {
    console.error('Get timeline error:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
};

/**
 * 更新时间表
 */
export const updateTimeline = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { date } = req.params;
    const { timeBlocks, tasks } = req.body;

    const updateData: any = {};
    
    if (timeBlocks !== undefined) {
      updateData.timeBlocks = JSON.stringify(timeBlocks);
      const { utilizationRate, totalWorkTime, statistics } = calculateTimeStats(timeBlocks);
      updateData.utilizationRate = utilizationRate;
      updateData.totalWorkTime = totalWorkTime;
      updateData.statistics = JSON.stringify(statistics);
    }
    
    if (tasks !== undefined) {
      updateData.tasks = JSON.stringify(tasks);
    }

    const timeline = await prisma.timeline.upsert({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      },
      update: updateData,
      create: {
        userId,
        date: new Date(date),
        timeBlocks: JSON.stringify(timeBlocks || []),
        tasks: JSON.stringify(tasks || []),
        ...updateData
      }
    });

    io.to(`user-${userId}`).emit('timeline:updated', timeline);

    res.json(timeline);
  } catch (error) {
    console.error('Update timeline error:', error);
    res.status(500).json({ error: 'Failed to update timeline' });
  }
};

/**
 * 删除时间表
 */
export const deleteTimeline = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { date } = req.params;

    await prisma.timeline.delete({
      where: {
        userId_date: {
          userId,
          date: new Date(date)
        }
      }
    });

    io.to(`user-${userId}`).emit('timeline:deleted', { date });

    res.json({ message: 'Timeline deleted successfully' });
  } catch (error) {
    console.error('Delete timeline error:', error);
    res.status(500).json({ error: 'Failed to delete timeline' });
  }
};

/**
 * 获取时间统计数据
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const timelines = await prisma.timeline.findMany({
      where: {
        userId,
        date: {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string)
        }
      }
    });

    // 聚合统计数据
    const totalStats = timelines.reduce((acc, timeline) => {
      let stats: any = {};
      try {
        stats = typeof timeline.statistics === 'string' 
          ? JSON.parse(timeline.statistics) 
          : timeline.statistics || {};
      } catch (e) {
        stats = {};
      }
      
      acc.totalWorkTime += timeline.totalWorkTime || 0;
      acc.avgUtilizationRate += timeline.utilizationRate || 0;
      acc.work += stats.work || 0;
      acc.study += stats.study || 0;
      acc.rest += stats.rest || 0;
      acc.meeting += stats.meeting || 0;
      return acc;
    }, {
      totalWorkTime: 0,
      avgUtilizationRate: 0,
      work: 0,
      study: 0,
      rest: 0,
      meeting: 0
    });

    if (timelines.length > 0) {
      totalStats.avgUtilizationRate /= timelines.length;
    }

    // 计算趋势
    const dailyStats = timelines.map(t => ({
      date: t.date,
      utilizationRate: t.utilizationRate,
      totalWorkTime: t.totalWorkTime,
      statistics: typeof t.statistics === 'string' ? JSON.parse(t.statistics) : t.statistics
    }));

    res.json({
      summary: totalStats,
      daily: dailyStats,
      period: {
        start: startDate,
        end: endDate,
        days: timelines.length
      }
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

/**
 * 辅助函数：计算时间统计数据
 */
function calculateTimeStats(timeBlocks: any[]) {
  let totalMinutes = 0;
  const statistics: any = {
    work: 0,
    study: 0,
    rest: 0,
    meeting: 0
  };

  timeBlocks.forEach(block => {
    const start = new Date(`2000-01-01T${block.start}`);
    const end = new Date(`2000-01-01T${block.end}`);
    const minutes = (end.getTime() - start.getTime()) / 60000;
    
    totalMinutes += minutes;
    
    const category = block.category || 'work';
    if (statistics[category] !== undefined) {
      statistics[category] += minutes;
    } else {
      statistics[category] = minutes;
    }
  });

  // 计算利用率（假设一天工作时间为8小时=480分钟）
  const utilizationRate = Math.min((totalMinutes / 480) * 100, 100);

  return {
    utilizationRate: Number(utilizationRate.toFixed(2)),
    totalWorkTime: totalMinutes,
    statistics
  };
}


