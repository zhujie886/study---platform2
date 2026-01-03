import { Request, Response } from 'express';
import prisma from '../utils/prisma';

function getAuthUserId(req: Request): string | null {
	return req.userId || null;
}

export const createPoll = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { roomId, question, options, pollType, correctAnswer } = req.body as any;
		const poll = await prisma.poll.create({
			data: {
				roomId,
				question,
				options: typeof options === 'string' ? options : JSON.stringify(options || []),
				pollType: pollType || 'single',
				correctAnswer: correctAnswer ? (typeof correctAnswer === 'string' ? correctAnswer : JSON.stringify(correctAnswer)) : null
			}
		});
		return res.json(poll);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const listPollsByRoom = async (req: Request, res: Response) => {
	try {
		const { roomId } = req.params;
		const polls = await prisma.poll.findMany({ where: { roomId }, orderBy: { createdAt: 'desc' } });
		return res.json(polls);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const submitPollAnswer = async (req: Request, res: Response) => {
	try {
		const userId = getAuthUserId(req);
		if (!userId) return res.status(401).json({ error: '未授权' });
		const { id } = req.params; // pollId
		const { answer } = req.body as any;

		const poll = await prisma.poll.findUnique({ where: { id } });
		if (!poll) return res.status(404).json({ error: '投票不存在' });

		let isCorrect: boolean | null = null;
		if (poll.correctAnswer) {
			try {
				const correct = JSON.parse(poll.correctAnswer);
				const ans = typeof answer === 'string' ? JSON.parse(answer) : answer;
				isCorrect = JSON.stringify(correct) === JSON.stringify(ans);
			} catch {
				isCorrect = null;
			}
		}

		const response = await prisma.pollResponse.upsert({
			where: { pollId_userId: { pollId: id, userId } },
			update: { answer: typeof answer === 'string' ? answer : JSON.stringify(answer), isCorrect },
			create: { pollId: id, userId, answer: typeof answer === 'string' ? answer : JSON.stringify(answer), isCorrect }
		});
		return res.json(response);
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};

export const getPollResults = async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const poll = await prisma.poll.findUnique({ where: { id } });
		if (!poll) return res.status(404).json({ error: '投票不存在' });
		const responses = await prisma.pollResponse.findMany({ where: { pollId: id } });
		return res.json({ poll, responses });
	} catch (err: any) {
		return res.status(500).json({ error: err.message });
	}
};




