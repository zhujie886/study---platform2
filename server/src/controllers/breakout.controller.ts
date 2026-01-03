import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { getSocketServer } from '../services/socket.service';

function getAuthUserId(req: Request): string | null {
	return req.userId || null;
}

// 创建分组讨论房间
export const createBreakoutRoom = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { mainRoomId, roomName, members } = req.body as { mainRoomId: string; roomName: string; members?: string[] };
		const room = await prisma.breakoutRoom.create({
			data: {
				mainRoomId,
				roomName,
				members: JSON.stringify(members || [])
			}
		});

		try { getSocketServer().of('/webrtc').to(mainRoomId).emit('breakout-created', room); } catch {}
		return res.json(room);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

// 列出主会议的分组
export const listBreakoutRooms = async (req: Request, res: Response) => {
	try {
		const { mainRoomId } = req.params;
		const list = await prisma.breakoutRoom.findMany({ where: { mainRoomId }, orderBy: { createdAt: 'asc' } });
		return res.json(list);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

// 更新成员列表
export const setBreakoutMembers = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params; // breakoutId
		const { members } = req.body as { members: string[] };
		const updated = await prisma.breakoutRoom.update({ where: { id }, data: { members: JSON.stringify(members || []) } });
		try { getSocketServer().of('/webrtc').to(updated.mainRoomId).emit('breakout-members-updated', { id, members }); } catch {}
		return res.json(updated);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

// 结束分组
export const endBreakoutRoom = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params;
		const room = await prisma.breakoutRoom.update({ where: { id }, data: { endedAt: new Date() } });
		try { getSocketServer().of('/webrtc').to(room.mainRoomId).emit('breakout-ended', { id }); } catch {}
		return res.json(room);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};




