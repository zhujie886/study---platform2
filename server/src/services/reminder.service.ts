import cron from 'node-cron';
import prisma from '../utils/prisma';
import { sendNotificationToUser } from './socket.service';
import nodemailer from 'nodemailer';

let emailTransporter: nodemailer.Transporter | null = null;

function initEmailService() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
    console.log('📧 Email service initialized');
  }
}

export function startReminderService() {
  initEmailService();

  // 每分钟执行一次
  cron.schedule('* * * * *', async () => {
    try {
      await processReminders();
      await processUpcomingBookingReminders();
      await cleanUpExpiredTasks(); // 清理过期任务
    } catch (error) {
      console.error('Reminder service error:', error);
    }
  });
  console.log('⏰ Reminder service started');
}

async function processReminders() {
  const now = new Date();

  // 查找已过触发时间且状态为 pending 的任务
  const reminderTasks = await prisma.reminderTask.findMany({
    where: {
      status: 'pending',
      triggerTime: {
        lte: now
      }
    },
    take: 50
  });

  if (reminderTasks.length === 0) return;

  console.log(`⏰ Processing ${reminderTasks.length} reminders`);

  for (const task of reminderTasks) {
    await sendReminder(task);
  }
}

async function sendReminder(task: any) {
  try {
    const user = await prisma.user.findUnique({ where: { id: task.userId } });
    if (!user) {
        await prisma.reminderTask.update({ where: { id: task.id }, data: { status: 'failed' } });
        return;
    }

    // WebSocket 推送
    sendNotificationToUser(task.userId, {
      id: task.id,
      type: task.type,
      relatedId: task.relatedId,
      title: task.title,
      description: task.description || '',
      timestamp: new Date()
    });

    // 邮件推送 (如果配置了)
    if (emailTransporter) {
        try {
            await emailTransporter.sendMail({
                from: process.env.SMTP_USER,
                to: user.email,
                subject: `[提醒] ${task.title}`,
                text: task.description || task.title
            });
        } catch (e) {
            console.error('Email send failed', e);
        }
    }

    // 标记为已完成
    await prisma.reminderTask.update({
      where: { id: task.id },
      data: { status: 'sent', updatedAt: new Date() }
    });

  } catch (error) {
    console.error(`Error sending reminder ${task.id}:`, error);
    await prisma.reminderTask.update({
      where: { id: task.id },
      data: { status: 'failed' }
    });
  }
}

async function processUpcomingBookingReminders() {
    // 简单实现：查找即将开始的预约自动创建提醒任务（此处略，依赖具体业务逻辑）
}

async function cleanUpExpiredTasks() {
    // 每周清理一次 30 天前的任务（逻辑可优化）
    if (new Date().getDay() === 0 && new Date().getHours() === 3 && new Date().getMinutes() === 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        await prisma.reminderTask.deleteMany({
            where: {
                status: 'sent',
                createdAt: { lt: thirtyDaysAgo }
            }
        });
    }
}


