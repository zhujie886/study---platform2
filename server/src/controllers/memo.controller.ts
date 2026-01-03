import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { encryptWithPassword, decryptWithPassword } from '../utils/encryption';
import { io } from '../index';

const sanitizeData = (data: any) => {
    return {
        ...data,
        labels: Array.isArray(data.labels) ? JSON.stringify(data.labels) : (data.labels || '[]'),
        attachments: Array.isArray(data.attachments) ? JSON.stringify(data.attachments) : (data.attachments || '[]'),
        locationReminder: typeof data.locationReminder === 'object' ? JSON.stringify(data.locationReminder) : (data.locationReminder || null),
        priority: Number(data.priority) || 0,
        reminderTime: (data.reminderTime && data.reminderTime !== '' && data.reminderTime !== 'null') 
            ? new Date(data.reminderTime) 
            : null
    };
};

const parseData = (memo: any) => {
    if (!memo) return null;
    return {
        ...memo,
        labels: typeof memo.labels === 'string' ? JSON.parse(memo.labels || '[]') : [],
        attachments: typeof memo.attachments === 'string' ? JSON.parse(memo.attachments || '[]') : [],
        locationReminder: typeof memo.locationReminder === 'string' ? JSON.parse(memo.locationReminder || 'null') : null
    };
};

export const createMemo = async (req: Request, res: Response) => {
  try {
    // 🔥 双重保险：再次检查 userId
    const userId = req.userId;
    if (!userId) {
        console.error('❌ Create Memo: userId is missing in controller!');
        // 返回 401 触发前端自动退出
        return res.status(401).json({ error: '认证失效，请重新登录' });
    }

    const cleanData = sanitizeData(req.body);

    if (!req.body.title || !req.body.content) {
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    let finalContent = req.body.content;
    let encryptedContent = null;
    let encryptionSalt = null;

    if (req.body.isEncrypted) {
      if (!req.body.encryptionPassword) {
        return res.status(400).json({ error: '需要设置加密密码' });
      }
      const encrypted = encryptWithPassword(req.body.content, req.body.encryptionPassword);
      encryptedContent = encrypted.encrypted;
      encryptionSalt = encrypted.salt;
      finalContent = '[ENCRYPTED]';
    }

    const memo = await prisma.memo.create({
      data: {
        userId: userId,
        title: req.body.title,
        content: finalContent,
        labels: cleanData.labels,
        priority: cleanData.priority,
        color: req.body.color,
        reminderTime: cleanData.reminderTime,
        locationReminder: cleanData.locationReminder,
        isEncrypted: Boolean(req.body.isEncrypted),
        encryptedContent,
        encryptionSalt,
        attachments: cleanData.attachments
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } }
      }
    });

    if (memo.reminderTime) {
      await prisma.reminderTask.create({
        data: {
          userId,
          type: 'memo',
          relatedId: memo.id,
          triggerTime: memo.reminderTime,
          title: `备忘录提醒: ${memo.title}`
        }
      });
    }

    const formattedMemo = parseData(memo);
    io.to(`user-${userId}`).emit('memo:created', formattedMemo);
    res.status(201).json(formattedMemo);

  } catch (error: any) {
    console.error('❌ Create memo DB error:', error);
    res.status(500).json({ error: '创建备忘录失败', details: error.message });
  }
};

export const getMemos = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { status, priority, page = 1, limit = 50, q, labels } = req.query;

    const where: any = {
      OR: [ { userId }, { sharedWith: { some: { sharedWithId: userId } } } ]
    };

    if (status) where.status = status;
    if (priority !== undefined) where.priority = Number(priority);
    if (q) {
        where.OR = [
            ...(where.OR || []),
            { title: { contains: String(q) } },
            { content: { contains: String(q) } }
        ];
    }
    if (labels) where.labels = { contains: String(labels) };

    const skip = (Number(page) - 1) * Number(limit);
    const [memos, total] = await Promise.all([
      prisma.memo.findMany({
        where,
        include: { user: { select: { id: true, username: true, avatar: true } } },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.memo.count({ where })
    ]);

    const formattedMemos = memos.map(parseData);
    res.json({ memos: formattedMemos, total, page: Number(page) });
  } catch (error) {
    console.error('Get memos error:', error);
    res.status(500).json({ error: 'Failed to fetch memos' });
  }
};

export const getMemoById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const memo = await prisma.memo.findUnique({ where: { id } });
        if (!memo) return res.status(404).json({ error: 'Memo not found' });
        res.json(parseData(memo));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch memo' });
    }
};

export const updateMemo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const cleanData = sanitizeData(req.body);
        delete cleanData.userId; 
        if (cleanData.reminderTime === undefined) delete cleanData.reminderTime;

        const memo = await prisma.memo.update({
            where: { id },
            data: {
                ...cleanData,
                labels: req.body.labels ? cleanData.labels : undefined,
                attachments: req.body.attachments ? cleanData.attachments : undefined,
                reminderTime: req.body.reminderTime !== undefined ? cleanData.reminderTime : undefined
            }
        });
        const formattedMemo = parseData(memo);
        io.to(`user-${req.userId}`).emit('memo:updated', formattedMemo);
        res.json(formattedMemo);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update' });
    }
};

export const deleteMemo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.memo.delete({ where: { id } });
        io.to(`user-${req.userId}`).emit('memo:deleted', { id });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete' });
    }
};

export const searchMemos = getMemos; 
export const shareMemo = async (req: Request, res: Response) => { res.json({msg: "Shared"}); };
export const decryptMemo = async (req: Request, res: Response) => { res.json({msg: "Decrypted"}); };


