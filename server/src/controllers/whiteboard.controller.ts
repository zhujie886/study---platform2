import { Request, Response } from 'express';
import prisma from '../utils/prisma';

function getAuthUserId(req: Request): string | null {
	return req.userId || null;
}

export const createWhiteboard = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { roomId, pageNumber } = req.body as { roomId: string; pageNumber?: number };
		const whiteboard = await prisma.whiteboard.create({
			data: { roomId, pageNumber: pageNumber || 1 }
		});
		return res.json(whiteboard);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const listWhiteboardsByRoom = async (req: Request, res: Response) => {
	try {
		const { roomId } = req.params;
		const list = await prisma.whiteboard.findMany({ where: { roomId }, orderBy: { createdAt: 'asc' } });
		return res.json(list);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const addWhiteboardAction = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params; // whiteboardId
		const { actionType, actionData } = req.body as { actionType: string; actionData: any };
		const action = await prisma.whiteboardAction.create({
			data: {
				whiteboardId: id,
				userId,
				actionType,
				actionData: typeof actionData === 'string' ? actionData : JSON.stringify(actionData)
			}
		});
		return res.json(action);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const listWhiteboardActions = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const actions = await prisma.whiteboardAction.findMany({ where: { whiteboardId: id }, orderBy: { createdAt: 'asc' } });
		return res.json(actions);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const clearWhiteboard = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params;
		await prisma.whiteboardAction.deleteMany({ where: { whiteboardId: id } });
		// 记录一次 clear 操作（便于客户端同步）
		await prisma.whiteboardAction.create({
			data: { whiteboardId: id, userId, actionType: 'clear', actionData: '{}' }
		});
		return res.json({ success: true });
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};




