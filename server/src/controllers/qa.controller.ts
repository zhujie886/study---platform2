import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_TAGS = 5;

const DEFAULT_CATEGORIES = [
  { name: '数学', description: '高数/概率/线性代数' },
  { name: '语言', description: '英语/日语/小语种' },
  { name: '计算机', description: '编程/算法/系统' },
  { name: '金融', description: '财会/金融/经济' },
  { name: '考研', description: '考研备考/择校' },
  { name: '面试', description: '面试准备/求职' }
];

type AuthRequest = Request & { user?: any; userId?: string };

const isAdminUser = (req: AuthRequest) => Boolean(req.user?.role === 'admin');

function parseNumber(value: any, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeTags(raw: any): string[] {
  if (!Array.isArray(raw)) return [];
  const tags = raw
    .map((t) => String(t || '').trim())
    .filter((t) => t.length > 0);
  return Array.from(new Set(tags)).slice(0, MAX_TAGS);
}

function normalizeAttachments(raw: any, uploaderId: string, target: { questionId?: string; answerId?: string }) {
  if (!Array.isArray(raw)) return [];
  type AttachmentInput = {
    uploaderId: string;
    url: string;
    name: string | null;
    size: number | null;
    mimeType: string | null;
    type: string;
    questionId?: string;
    answerId?: string;
  };
  return raw
    .map((item) => {
      if (!item || typeof item.url !== 'string') return null;
      const url = item.url.trim();
      if (!url) return null;
      return {
        uploaderId,
        url,
        name: typeof item.name === 'string' ? item.name.trim() : null,
        size: Number.isFinite(Number(item.size)) ? Number(item.size) : null,
        mimeType: typeof item.mimeType === 'string' ? item.mimeType.trim() : null,
        type: typeof item.type === 'string' ? item.type.trim() : 'file',
        ...target
      };
    })
    .filter((item): item is AttachmentInput => Boolean(item));
}

function sanitizeUser(user: any, isAnonymous: boolean) {
  if (!user) return null;
  if (!isAnonymous) return user;
  return {
    id: null,
    username: 'Anonymous',
    avatar: null,
    isAnonymous: true
  };
}

function mapAnswer(answer: any, acceptedAnswerId?: string) {
  return {
    id: answer.id,
    questionId: answer.questionId,
    content: answer.content,
    contentFormat: answer.contentFormat,
    isAnonymous: answer.isAnonymous,
    status: answer.status,
    voteCount: answer.voteCount,
    createdAt: answer.createdAt,
    updatedAt: answer.updatedAt,
    editedAt: answer.editedAt,
    attachments: answer.attachments ?? [],
    user: sanitizeUser(answer.user, answer.isAnonymous),
    isAccepted: acceptedAnswerId ? answer.id === acceptedAnswerId : false
  };
}

function mapQuestion(
  question: any,
  includeAnswers = false,
  viewer?: { userId?: string; isAdmin?: boolean }
) {
  const tags = (question.tags ?? []).map((qt: any) => qt.tag);
  const answers = includeAnswers
    ? (question.answers ?? []).map((answer: any) =>
        mapAnswer(answer, question.acceptedAnswerId)
      )
    : undefined;

  if (includeAnswers && answers) {
    answers.sort((a: any, b: any) => {
      if (a.isAccepted !== b.isAccepted) {
        return a.isAccepted ? -1 : 1;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const base = {
    id: question.id,
    title: question.title,
    content: question.content,
    contentFormat: question.contentFormat,
    isAnonymous: question.isAnonymous,
    status: question.status,
    acceptedAnswerId: question.acceptedAnswerId,
    viewCount: question.viewCount,
    answerCount: question.answerCount,
    bountyPoints: question.bountyPoints,
    bountyAmount: question.bountyAmount,
    resolvedAt: question.resolvedAt,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt,
    editedAt: question.editedAt,
    user: sanitizeUser(question.user, question.isAnonymous),
    category: question.category,
    tags,
    attachments: question.attachments ?? [],
    answers
  };

  if (viewer) {
    const viewerId = viewer.userId;
    const canEdit = Boolean(viewerId && (question.userId === viewerId || viewer.isAdmin));
    return {
      ...base,
      canEdit,
      canAccept: canEdit
    };
  }

  return base;
}

// ==================== Category ====================

export const listCategories = async (req: Request, res: Response) => {
  try {
    const includeInactive = (req.query.includeInactive === 'true') && isAdminUser(req as AuthRequest);
    const where = includeInactive ? {} : { isActive: true };
    let categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    if (categories.length === 0) {
      await Promise.all(
        DEFAULT_CATEGORIES.map((item) =>
          prisma.category.upsert({
            where: { name: item.name },
            update: {
              isActive: true,
              description: item.description || undefined
            },
            create: {
              name: item.name,
              description: item.description,
              isActive: true
            }
          })
        )
      );
      categories = await prisma.category.findMany({
        where,
        orderBy: { name: 'asc' }
      });
    }
    res.json({ data: categories });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({ error: 'Failed to list categories' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : null
      }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// ==================== Tag ====================

export const listTags = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const includePending = (req.query.includePending === 'true') && isAdminUser(req as AuthRequest);
    const tags = await prisma.tag.findMany({
      where: {
        ...(includePending ? {} : { isApproved: true }),
        ...(q ? { name: { contains: q } } : {})
      },
      orderBy: { name: 'asc' },
      take: MAX_LIMIT
    });
    res.json({ data: tags });
  } catch (error) {
    console.error('List tags error:', error);
    res.status(500).json({ error: 'Failed to list tags' });
  }
};

export const createTag = async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const trimmed = String(name || '').trim();
    if (!trimmed) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const tag = await prisma.tag.upsert({
      where: { name: trimmed },
      update: {},
      create: {
        name: trimmed,
        description: description ? String(description).trim() : null,
        createdById: req.userId ?? null,
        isApproved: isAdminUser(req)
      }
    });

    res.status(201).json(tag);
  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
};

// ==================== Question ====================

export const listQuestions = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseNumber(req.query.page, DEFAULT_PAGE), 1);
    const limit = Math.min(parseNumber(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT);
    const skip = (page - 1) * limit;

    const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const tag = typeof req.query.tag === 'string' ? req.query.tag.trim() : '';
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'latest';

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;
    if (tag) {
      where.tags = { some: { tag: { name: tag } } };
    }
    if (q) {
      where.OR = [
        { title: { contains: q } },
        { content: { contains: q } }
      ];
    }

    const orderBy: Prisma.QuestionOrderByWithRelationInput[] =
      sort === 'hot' ? [{ viewCount: 'desc' }, { createdAt: 'desc' }] : [{ createdAt: 'desc' }];

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          user: { select: { id: true, username: true, avatar: true, isVerified: true } },
          category: true,
          tags: { include: { tag: true } },
          attachments: true
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.question.count({ where })
    ]);

    res.json({
      data: questions.map((q) => mapQuestion(q, false)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List questions error:', error);
    res.status(500).json({ error: 'Failed to list questions' });
  }
};

export const getQuestionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatar: true, isVerified: true } },
        category: true,
        tags: { include: { tag: true } },
        attachments: true,
        answers: {
          include: {
            user: { select: { id: true, username: true, avatar: true, isVerified: true } },
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    await prisma.question.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    const viewer = req as AuthRequest;
    res.json(mapQuestion(question, true, { userId: viewer.userId, isAdmin: isAdminUser(viewer) }));
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Failed to get question' });
  }
};

export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const {
      title,
      content,
      contentFormat = 'markdown',
      categoryId,
      tags,
      attachments,
      isAnonymous = false,
      bountyPoints,
      bountyAmount
    } = req.body;

    const trimmedTitle = String(title || '').trim();
    const trimmedContent = String(content || '').trim();
    if (!trimmedTitle || !trimmedContent || !categoryId) {
      return res.status(400).json({ error: 'Title, content, and categoryId are required' });
    }

    let category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      category = await prisma.category.findUnique({ where: { name: categoryId } });
    }
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: String(categoryId).trim(),
          isActive: true
        }
      });
    } else if (!category.isActive) {
      category = await prisma.category.update({
        where: { id: category.id },
        data: { isActive: true }
      });
    }

    const normalizedTags = normalizeTags(tags);

    const question = await prisma.question.create({
      data: {
        userId,
        categoryId: category.id,
        title: trimmedTitle,
        content: trimmedContent,
        contentFormat,
        isAnonymous: Boolean(isAnonymous),
        bountyPoints: Number.isFinite(Number(bountyPoints)) ? Number(bountyPoints) : null,
        bountyAmount: Number.isFinite(Number(bountyAmount)) ? Number(bountyAmount) : null
      }
    });

    if (normalizedTags.length > 0) {
      const tagRecords = await Promise.all(
        normalizedTags.map((name) =>
          prisma.tag.upsert({
            where: { name },
            update: {},
            create: {
              name,
              createdById: userId,
              isApproved: isAdminUser(req)
            }
          })
        )
      );
      await prisma.questionTag.createMany({
        data: tagRecords.map((t) => ({ questionId: question.id, tagId: t.id }))
      });
    }

    const attachmentData = normalizeAttachments(attachments, userId, { questionId: question.id });
    if (attachmentData.length > 0) {
      await prisma.attachment.createMany({ data: attachmentData });
    }

    const full = await prisma.question.findUnique({
      where: { id: question.id },
      include: {
        user: { select: { id: true, username: true, avatar: true, isVerified: true } },
        category: true,
        tags: { include: { tag: true } },
        attachments: true
      }
    });

    res.status(201).json(full ? mapQuestion(full, false) : question);
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Failed to create question' });
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Question not found' });
    if (existing.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      title,
      content,
      contentFormat,
      categoryId,
      tags,
      attachments,
      isAnonymous
    } = req.body;

    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!category || !category.isActive) {
        return res.status(400).json({ error: 'Invalid category' });
      }
    }

    await prisma.question.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(content !== undefined ? { content: String(content).trim() } : {}),
        ...(contentFormat !== undefined ? { contentFormat } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
        ...(isAnonymous !== undefined ? { isAnonymous: Boolean(isAnonymous) } : {}),
        editedAt: new Date()
      }
    });

    if (tags !== undefined) {
      const normalizedTags = normalizeTags(tags);
      await prisma.questionTag.deleteMany({ where: { questionId: id } });
      if (normalizedTags.length > 0) {
        const tagRecords = await Promise.all(
          normalizedTags.map((name) =>
            prisma.tag.upsert({
              where: { name },
              update: {},
              create: {
                name,
                createdById: userId,
                isApproved: isAdminUser(req)
              }
            })
          )
        );
        await prisma.questionTag.createMany({
          data: tagRecords.map((t) => ({ questionId: id, tagId: t.id }))
        });
      }
    }

    if (attachments !== undefined) {
      await prisma.attachment.deleteMany({ where: { questionId: id } });
      const attachmentData = normalizeAttachments(attachments, userId, { questionId: id });
      if (attachmentData.length > 0) {
        await prisma.attachment.createMany({ data: attachmentData });
      }
    }

    const updated = await prisma.question.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatar: true, isVerified: true } },
        category: true,
        tags: { include: { tag: true } },
        attachments: true
      }
    });

    res.json(updated ? mapQuestion(updated, false) : { id });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Question not found' });
    if (existing.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await prisma.question.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

export const resolveQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Question not found' });
    if (existing.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        status: 'resolved',
        resolvedAt: new Date()
      }
    });

    res.json({ id: updated.id, status: updated.status, resolvedAt: updated.resolvedAt });
  } catch (error) {
    console.error('Resolve question error:', error);
    res.status(500).json({ error: 'Failed to resolve question' });
  }
};

export const reopenQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Question not found' });
    if (existing.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.question.update({
      where: { id },
      data: {
        status: 'open',
        resolvedAt: null
      }
    });

    res.json({ id: updated.id, status: updated.status, resolvedAt: updated.resolvedAt });
  } catch (error) {
    console.error('Reopen question error:', error);
    res.status(500).json({ error: 'Failed to reopen question' });
  }
};

// ==================== Answer ====================

export const createAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: questionId } = req.params;
    const { content, contentFormat = 'markdown', isAnonymous = false, attachments } = req.body;

    const trimmedContent = String(content || '').trim();
    if (!trimmedContent) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.status === 'closed') {
      return res.status(400).json({ error: 'Question is closed' });
    }

    const answer = await prisma.answer.create({
      data: {
        questionId,
        userId,
        content: trimmedContent,
        contentFormat,
        isAnonymous: Boolean(isAnonymous)
      },
      include: {
        user: { select: { id: true, username: true, avatar: true, isVerified: true } },
        attachments: true
      }
    });

    await prisma.question.update({
      where: { id: questionId },
      data: { answerCount: { increment: 1 } }
    });

    const attachmentData = normalizeAttachments(attachments, userId, { answerId: answer.id });
    if (attachmentData.length > 0) {
      await prisma.attachment.createMany({ data: attachmentData });
    }

    const refreshed = await prisma.answer.findUnique({
      where: { id: answer.id },
      include: {
        user: { select: { id: true, username: true, avatar: true, isVerified: true } },
        attachments: true
      }
    });

    res.status(201).json(refreshed ? mapAnswer(refreshed, question.acceptedAnswerId || undefined) : answer);
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ error: 'Failed to create answer' });
  }
};

export const updateAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { content, contentFormat, isAnonymous } = req.body;

    const existing = await prisma.answer.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Answer not found' });
    if (existing.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.answer.update({
      where: { id },
      data: {
        ...(content !== undefined ? { content: String(content).trim() } : {}),
        ...(contentFormat !== undefined ? { contentFormat } : {}),
        ...(isAnonymous !== undefined ? { isAnonymous: Boolean(isAnonymous) } : {}),
        editedAt: new Date()
      },
      include: {
        user: { select: { id: true, username: true, avatar: true, isVerified: true } },
        attachments: true
      }
    });

    res.json(mapAnswer(updated));
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({ error: 'Failed to update answer' });
  }
};

export const deleteAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const existing = await prisma.answer.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Answer not found' });
    if (existing.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.answer.delete({ where: { id } });
    await prisma.question.update({
      where: { id: existing.questionId },
      data: { answerCount: { decrement: 1 } }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ error: 'Failed to delete answer' });
  }
};

// ==================== Accept Answer ====================

export const acceptAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: questionId } = req.params;
    const { answerId } = req.body;
    if (!answerId) return res.status(400).json({ error: 'answerId is required' });

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ error: 'Question not found' });

    if (question.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const answer = await prisma.answer.findUnique({ where: { id: answerId } });
    if (!answer || answer.questionId !== questionId) {
      return res.status(400).json({ error: 'Answer does not belong to this question' });
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        acceptedAnswerId: answerId,
        status: 'resolved',
        resolvedAt: new Date()
      }
    });

    await prisma.acceptedAnswer.create({
      data: {
        questionId,
        answerId,
        acceptedById: userId
      }
    });

    res.json({ acceptedAnswerId: answerId });
  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({ error: 'Failed to accept answer' });
  }
};

export const revokeAccept = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { id: questionId } = req.params;
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ error: 'Question not found' });
    if (question.userId !== userId && !isAdminUser(req)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.question.update({
      where: { id: questionId },
      data: {
        acceptedAnswerId: null,
        status: 'open',
        resolvedAt: null
      }
    });

    await prisma.acceptedAnswer.updateMany({
      where: {
        questionId,
        revokedAt: null
      },
      data: { revokedAt: new Date() }
    });

    res.json({ acceptedAnswerId: null });
  } catch (error) {
    console.error('Revoke accept error:', error);
    res.status(500).json({ error: 'Failed to revoke acceptance' });
  }
};
