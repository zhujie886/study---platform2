import { Request, Response } from 'express';
import { getSocketServer } from '../services/socket.service';

function getAuthUserId(req: Request): string | null {
	return req.userId || null;
}

// 占位：接收第三方转写结果并广播到房间
export const pushCaptionLine = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { roomId } = req.params;
		const { text, lang } = req.body as { text: string; lang?: string };
		getSocketServer().of('/webrtc').to(roomId).emit('caption', {
			text,
			lang: lang || 'zh-CN',
			from: 'caption'
		});
		return res.json({ delivered: true });
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};




