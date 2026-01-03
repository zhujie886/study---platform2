/**
 * 私信系统控制器
 * 实现用户间私信发送、接收、已读等功能
 */

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getSocketServer } from '../services/socket.service';

/**
 * 发送私信
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const senderId = req.userId!;
    const { receiverId, content, imageUrl, voiceUrl } = req.body;

    if (!receiverId || (!content && !imageUrl && !voiceUrl)) {
      return res.status(400).json({ error: '接收人和消息内容不能为空' });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: '不能给自己发私信' });
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: content || '',
        imageUrl,
        voiceUrl
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      }
    });

    // 实时推送给接收者
    const io = getSocketServer();
    io.to(`user-${receiverId}`).emit('new-message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: '发送私信失败' });
  }
};

/**
 * 获取与某用户的聊天记录
 */
export const getConversation = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { otherUserId } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId }
        ]
      },
      include: {
        sender: {
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
    });

    // 标记为已读
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({
      data: messages.reverse(),
      page: pageNum,
      limit: limitNum
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: '获取聊天记录失败' });
  }
};

/**
 * 获取会话列表
 */
export const getConversationList = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    // 获取所有相关的消息，按对话分组
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 按对话对象分组，只保留最新一条
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      
      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          otherUser: msg.senderId === userId ? msg.receiver : msg.sender,
          lastMessage: msg,
          unreadCount: 0
        });
      }
    });

    // 计算未读数
    for (const [otherUserId, conversation] of conversationsMap) {
      const unreadCount = await prisma.message.count({
        where: {
          senderId: otherUserId,
          receiverId: userId,
          isRead: false
        }
      });
      conversation.unreadCount = unreadCount;
    }

    const conversations = Array.from(conversationsMap.values());

    res.json({ data: conversations });
  } catch (error) {
    console.error('Get conversation list error:', error);
    res.status(500).json({ error: '获取会话列表失败' });
  }
};

/**
 * 标记消息为已读
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { otherUserId } = req.params;

    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    res.json({ message: '已标记为已读' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: '标记已读失败' });
  }
};

/**
 * 获取未读消息数
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: '获取未读数失败' });
  }
};

/**
 * 删除消息
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId }
    });

    if (!message) {
      return res.status(404).json({ error: '消息不存在' });
    }

    if (message.senderId !== userId && message.receiverId !== userId) {
      return res.status(403).json({ error: '无权删除该消息' });
    }

    await prisma.message.delete({
      where: { id: messageId }
    });

    res.json({ message: '删除成功' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: '删除消息失败' });
  }
};


