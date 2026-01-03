/**
 * 会议控制器 - 升级版
 * 实现会议链接邀请、弹幕系统、黑板权限管理等功能
 */

import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getSocketServer } from '../services/socket.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * 创建会议并生成邀请链接
 */
export const createMeetingWithLink = async (req: Request, res: Response) => {
  try {
    const hostId = req.userId!;
    const {
      title,
      description,
      password,
      customLinkName,
      linkType = 'permanent', // permanent/24h/once
      joinPermission = 'invited', // invited/approval/public
      scheduledAt,
      invitedUserIds = [] // 直接邀请的用户ID数组
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: '会议标题不能为空' });
    }

    // 生成唯一的会议号和邀请链接
    const roomNumber = Date.now().toString();
    const inviteLink = `${uuidv4().slice(0, 8)}`;
    
    // 计算链接过期时间
    let linkExpiry: Date | undefined;
    if (linkType === '24h') {
      linkExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const room = await prisma.videoRoom.create({
      data: {
        hostId,
        roomNumber,
        password: password || undefined,
        title,
        description: description || undefined,
        inviteLink,
        linkType,
        ...(linkExpiry ? { linkExpiry } : {}),
        joinPermission,
        customLinkName: customLinkName || title,
        ...(scheduledAt ? { scheduledAt: new Date(scheduledAt) } : {}),
        status: scheduledAt ? 'scheduled' : 'active',
        ...(scheduledAt ? {} : { startedAt: new Date() })
      }
    });

    // 创建邀请记录
    if (invitedUserIds.length > 0) {
      await Promise.all(
        invitedUserIds.map((inviteeId: string) =>
          prisma.meetingInvitation.create({
            data: {
              roomId: room.id,
              inviterId: hostId,
              inviteeId,
              message: `邀请您参加「${title}」会议`
            }
          })
        )
      );

      // 实时通知被邀请者
      const io = getSocketServer();
      invitedUserIds.forEach((userId: string) => {
        io.to(`user-${userId}`).emit('meeting-invitation', {
          room,
          inviter: hostId,
          message: `邀请您参加「${title}」会议`
        });
      });
    }

    // 生成完整邀请链接URL
    const fullInviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/meeting/join/${inviteLink}`;

    res.status(201).json({
      room,
      inviteUrl: fullInviteUrl,
      inviteLink
    });
  } catch (error) {
    console.error('创建会议失败:', error);
    res.status(500).json({ error: '创建会议失败' });
  }
};

/**
 * 通过邀请链接加入会议
 */
export const joinByLink = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { inviteLink } = req.params;
    const { password } = req.body;

    const room = await prisma.videoRoom.findUnique({
      where: { inviteLink },
      include: {
        host: {
          select: { id: true, username: true, avatar: true }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: '会议不存在或链接已失效' });
    }

    // 检查链接是否过期
    if (room.linkExpiry && new Date(room.linkExpiry) < new Date()) {
      return res.status(400).json({ error: '邀请链接已过期' });
    }

    // 检查会议密码
    if (room.password && room.password !== password) {
      return res.status(401).json({ error: '会议密码错误' });
    }

    // 检查会议状态
    if (room.status === 'ended') {
      return res.status(400).json({ error: '会议已结束' });
    }

    // 检查加入权限
    if (room.joinPermission === 'invited') {
      const invitation = await prisma.meetingInvitation.findUnique({
        where: {
          roomId_inviteeId: {
            roomId: room.id,
            inviteeId: userId
          }
        }
      });

      if (!invitation) {
        return res.status(403).json({ error: '您未被邀请参加此会议' });
      }
    }

    // 加入会议
    const participant = await prisma.roomParticipant.upsert({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId
        }
      },
      create: {
        roomId: room.id,
        userId,
        role: 'participant'
      },
      update: {
        leftAt: null
      }
    });

    // 如果是单次链接，标记为已使用
    if (room.linkType === 'once') {
      await prisma.videoRoom.update({
        where: { id: room.id },
        data: { linkExpiry: new Date() }
      });
    }

    // 通知所有参会者
    const io = getSocketServer();
    io.to(`room-${room.id}`).emit('participant-joined', {
      participant,
      userId
    });

    res.json({ room, participant });
  } catch (error) {
    console.error('加入会议失败:', error);
    res.status(500).json({ error: '加入会议失败' });
  }
};

/**
 * 发送会议邀请
 */
export const sendMeetingInvitation = async (req: Request, res: Response) => {
  try {
    const inviterId = req.userId!;
    const { roomId, inviteeId, message } = req.body;

    const room = await prisma.videoRoom.findUnique({
      where: { id: roomId }
    });

    if (!room) {
      return res.status(404).json({ error: '会议不存在' });
    }

    if (room.hostId !== inviterId) {
      return res.status(403).json({ error: '仅主持人可发送邀请' });
    }

    const invitation = await prisma.meetingInvitation.create({
      data: {
        roomId,
        inviterId,
        inviteeId,
        message: message || `邀请您参加「${room.title}」会议`
      },
      include: {
        inviter: {
          select: { id: true, username: true, avatar: true }
        }
      }
    });

    // 实时通知
    const io = getSocketServer();
    io.to(`user-${inviteeId}`).emit('meeting-invitation', {
      invitation,
      room
    });

    res.status(201).json(invitation);
  } catch (error) {
    console.error('发送邀请失败:', error);
    res.status(500).json({ error: '发送邀请失败' });
  }
};

/**
 * 响应会议邀请
 */
export const respondToInvitation = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { invitationId } = req.params;
    const { status } = req.body; // accepted/rejected

    const invitation = await prisma.meetingInvitation.findUnique({
      where: { id: invitationId },
      include: { room: true }
    });

    if (!invitation) {
      return res.status(404).json({ error: '邀请不存在' });
    }

    if (invitation.inviteeId !== userId) {
      return res.status(403).json({ error: '无权操作' });
    }

    await prisma.meetingInvitation.update({
      where: { id: invitationId },
      data: {
        status,
        respondedAt: new Date()
      }
    });

    // 如果接受邀请，自动加入会议
    if (status === 'accepted') {
      await prisma.roomParticipant.upsert({
        where: {
          roomId_userId: {
            roomId: invitation.roomId,
            userId
          }
        },
        create: {
          roomId: invitation.roomId,
          userId,
          role: 'participant'
        },
        update: {
          leftAt: null
        }
      });
    }

    // 通知邀请人
    const io = getSocketServer();
    io.to(`user-${invitation.inviterId}`).emit('invitation-response', {
      invitationId,
      inviteeId: userId,
      status
    });

    res.json({ message: status === 'accepted' ? '已接受邀请' : '已拒绝邀请' });
  } catch (error) {
    console.error('响应邀请失败:', error);
    res.status(500).json({ error: '响应邀请失败' });
  }
};

/**
 * 获取我的会议邀请列表
 */
export const getMyInvitations = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { status = 'pending' } = req.query;

    const invitations = await prisma.meetingInvitation.findMany({
      where: {
        inviteeId: userId,
        ...(status !== 'all' && { status: status as string })
      },
      include: {
        room: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            status: true
          }
        },
        inviter: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invitations });
  } catch (error) {
    console.error('获取邀请失败:', error);
    res.status(500).json({ error: '获取邀请失败' });
  }
};

// ========== 弹幕系统 ==========

/**
 * 发送弹幕
 */
export const sendBarrage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { roomId, content, emoji, mentionUserId } = req.body;

    if (!content || content.length > 50) {
      return res.status(400).json({ error: '弹幕内容不能为空且不超过50字' });
    }

    // 检查是否在会议中
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!participant || participant.leftAt) {
      return res.status(403).json({ error: '您不在会议中' });
    }

    // 检查发送频率（10秒内最多2条）
    const recentBarrages = await prisma.barrage.count({
      where: {
        roomId,
        userId,
        createdAt: {
          gte: new Date(Date.now() - 10000)
        }
      }
    });

    if (recentBarrages >= 2) {
      return res.status(429).json({ error: '发送太频繁，请稍后再试' });
    }

    // 生成颜色hash（基于用户ID）
    const colorHash = `#${userId.slice(0, 6)}`;

    const barrage = await prisma.barrage.create({
      data: {
        roomId,
        userId,
        username: participant.user.username,
        content,
        emoji,
        mentionUserId,
        colorHash
      }
    });

    // 实时推送给所有参会者
    const io = getSocketServer();
    io.to(`room-${roomId}`).emit('new-barrage', barrage);

    // 如果@了某人，额外通知
    if (mentionUserId) {
      io.to(`user-${mentionUserId}`).emit('barrage-mention', {
        barrage,
        roomId
      });
    }

    res.status(201).json(barrage);
  } catch (error) {
    console.error('发送弹幕失败:', error);
    res.status(500).json({ error: '发送弹幕失败' });
  }
};

/**
 * 撤回弹幕
 */
export const revokeBarrage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { barrageId } = req.params;

    const barrage = await prisma.barrage.findUnique({
      where: { id: barrageId }
    });

    if (!barrage) {
      return res.status(404).json({ error: '弹幕不存在' });
    }

    if (barrage.userId !== userId) {
      return res.status(403).json({ error: '只能撤回自己的弹幕' });
    }

    // 检查是否在10秒内
    const elapsed = Date.now() - barrage.createdAt.getTime();
    if (elapsed > 10000) {
      return res.status(400).json({ error: '超过撤回时限（10秒）' });
    }

    await prisma.barrage.update({
      where: { id: barrageId },
      data: {
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    // 实时通知
    const io = getSocketServer();
    io.to(`room-${barrage.roomId}`).emit('barrage-revoked', { barrageId });

    res.json({ message: '弹幕已撤回' });
  } catch (error) {
    console.error('撤回弹幕失败:', error);
    res.status(500).json({ error: '撤回弹幕失败' });
  }
};

/**
 * 置顶弹幕（仅主持人）
 */
export const pinBarrage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { barrageId } = req.params;
    const { duration = 30 } = req.body; // 置顶时长（秒）

    const barrage = await prisma.barrage.findUnique({
      where: { id: barrageId },
      include: { room: true }
    });

    if (!barrage) {
      return res.status(404).json({ error: '弹幕不存在' });
    }

    // 检查权限
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId: barrage.roomId,
          userId
        }
      }
    });

    if (!participant || !['host', 'co-host'].includes(participant.role)) {
      return res.status(403).json({ error: '仅主持人可置顶弹幕' });
    }

    const pinnedUntil = new Date(Date.now() + duration * 1000);

    await prisma.barrage.update({
      where: { id: barrageId },
      data: {
        isPinned: true,
        pinnedUntil
      }
    });

    // 实时通知
    const io = getSocketServer();
    io.to(`room-${barrage.roomId}`).emit('barrage-pinned', {
      barrageId,
      pinnedUntil
    });

    res.json({ message: '弹幕已置顶' });
  } catch (error) {
    console.error('置顶弹幕失败:', error);
    res.status(500).json({ error: '置顶弹幕失败' });
  }
};

/**
 * 获取会议弹幕列表
 */
export const getRoomBarrages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const { limit = 100 } = req.query;

    const barrages = await prisma.barrage.findMany({
      where: {
        roomId,
        isRevoked: false
      },
      orderBy: { createdAt: 'asc' },
      take: parseInt(limit as string)
    });

    res.json({ barrages });
  } catch (error) {
    console.error('获取弹幕失败:', error);
    res.status(500).json({ error: '获取弹幕失败' });
  }
};

// ========== 黑板权限管理 ==========

/**
 * 授予黑板编辑权限
 */
export const grantWhiteboardPermission = async (req: Request, res: Response) => {
  try {
    const hostId = req.userId!;
    const { roomId, userId } = req.body;

    // 检查主持人权限
    const room = await prisma.videoRoom.findUnique({
      where: { id: roomId }
    });

    if (!room || room.hostId !== hostId) {
      return res.status(403).json({ error: '仅主持人可授予权限' });
    }

    await prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      },
      data: {
        canEditWhiteboard: true
      }
    });

    // 实时通知
    const io = getSocketServer();
    io.to(`user-${userId}`).emit('whiteboard-permission-granted', { roomId });
    io.to(`room-${roomId}`).emit('participant-permission-updated', { userId, canEditWhiteboard: true });

    res.json({ message: '已授予黑板编辑权限' });
  } catch (error) {
    console.error('授予权限失败:', error);
    res.status(500).json({ error: '授予权限失败' });
  }
};

/**
 * 撤销黑板编辑权限
 */
export const revokeWhiteboardPermission = async (req: Request, res: Response) => {
  try {
    const hostId = req.userId!;
    const { roomId, userId } = req.body;

    // 检查主持人权限
    const room = await prisma.videoRoom.findUnique({
      where: { id: roomId }
    });

    if (!room || room.hostId !== hostId) {
      return res.status(403).json({ error: '仅主持人可撤销权限' });
    }

    await prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      },
      data: {
        canEditWhiteboard: false
      }
    });

    // 实时通知
    const io = getSocketServer();
    io.to(`user-${userId}`).emit('whiteboard-permission-revoked', { roomId });
    io.to(`room-${roomId}`).emit('participant-permission-updated', { userId, canEditWhiteboard: false });

    res.json({ message: '已撤销黑板编辑权限' });
  } catch (error) {
    console.error('撤销权限失败:', error);
    res.status(500).json({ error: '撤销权限失败' });
  }
};

/**
 * 设置全员可编辑黑板
 */
export const setWhiteboardPublicEdit = async (req: Request, res: Response) => {
  try {
    const hostId = req.userId!;
    const { roomId, enabled } = req.body;

    const room = await prisma.videoRoom.findUnique({
      where: { id: roomId }
    });

    if (!room || room.hostId !== hostId) {
      return res.status(403).json({ error: '仅主持人可设置' });
    }

    // 更新所有参会者的权限
    await prisma.roomParticipant.updateMany({
      where: { roomId },
      data: {
        canEditWhiteboard: enabled
      }
    });

    // 实时通知
    const io = getSocketServer();
    io.to(`room-${roomId}`).emit('whiteboard-public-edit-changed', { enabled });

    res.json({ message: enabled ? '已开启全员编辑' : '已关闭全员编辑' });
  } catch (error) {
    console.error('设置失败:', error);
    res.status(500).json({ error: '设置失败' });
  }
};


