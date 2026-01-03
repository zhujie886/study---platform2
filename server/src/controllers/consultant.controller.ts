import { Request, Response } from 'express';
import prisma from '../utils/prisma';

const toJsonString = (value: any) => {
  if (value === undefined) return undefined;
  return JSON.stringify(value || []);
};

const toOptionalString = (value: any) => {
  if (value === undefined) return undefined;
  const trimmed = String(value || '').trim();
  return trimmed ? trimmed : null;
};

const safeParseArray = <T = any>(value: string | null, fallback: T[] = []) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// Update consultant profile (user fields + consultant profile)
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      headline,
      skills,
      portfolioLinks,
      languages,
      timezone,
      primaryDomain,
      secondaryDomains,
      projects,
      certifications,
      bio,
      isConsultant
    } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(bio !== undefined ? { bio: toOptionalString(bio) } : {}),
        ...(isConsultant !== undefined ? { isConsultant } : { isConsultant: true })
      }
    });

    const profile = await prisma.consultantProfile.upsert({
      where: { userId },
      update: {
        ...(headline !== undefined ? { headline: toOptionalString(headline) } : {}),
        ...(skills !== undefined ? { skills: toJsonString(skills) } : {}),
        ...(portfolioLinks !== undefined ? { portfolioLinks: toJsonString(portfolioLinks) } : {}),
        ...(languages !== undefined ? { languages: toJsonString(languages) } : {}),
        ...(timezone !== undefined ? { timezone: toOptionalString(timezone) } : {}),
        ...(primaryDomain !== undefined ? { primaryDomain: toOptionalString(primaryDomain) } : {}),
        ...(secondaryDomains !== undefined ? { secondaryDomains: toJsonString(secondaryDomains) } : {}),
        ...(projects !== undefined ? { projects: toJsonString(projects) } : {}),
        ...(certifications !== undefined ? { certifications: toJsonString(certifications) } : {})
      },
      create: {
        userId,
        headline: toOptionalString(headline),
        skills: toJsonString(skills) ?? JSON.stringify([]),
        portfolioLinks: toJsonString(portfolioLinks) ?? JSON.stringify([]),
        languages: toJsonString(languages) ?? JSON.stringify([]),
        timezone: toOptionalString(timezone) || 'Asia/Shanghai',
        primaryDomain: toOptionalString(primaryDomain),
        secondaryDomains: toJsonString(secondaryDomains) ?? JSON.stringify([]),
        projects: toJsonString(projects) ?? JSON.stringify([]),
        certifications: toJsonString(certifications) ?? JSON.stringify([])
      }
    });

    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Public consultant profile (safe fields only)
export const getConsultantPublic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        isVerified: true,
        isConsultant: true,
        rating: true,
        totalBookings: true,
        consultantProfile: true,
        services: { where: { isActive: true } },
        availabilityRules: { where: { isActive: true } }
      }
    });

    if (!user) return res.status(404).json({ error: '咨询师不存在' });

    const profile = user.consultantProfile
      ? {
          ...user.consultantProfile,
          skills: safeParseArray(user.consultantProfile.skills),
          portfolioLinks: safeParseArray(user.consultantProfile.portfolioLinks),
          languages: safeParseArray(user.consultantProfile.languages),
          secondaryDomains: safeParseArray(user.consultantProfile.secondaryDomains),
          projects: safeParseArray(user.consultantProfile.projects),
          certifications: safeParseArray(user.consultantProfile.certifications)
        }
      : null;

    res.json({
      ...user,
      consultantProfile: profile,
      services: user.services.map((service: any) => ({
        ...service,
        tags: safeParseArray(service.tagsJson)
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create service package
export const createService = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      title,
      description,
      price,
      currency = 'CNY',
      durationMinutes,
      deliveryType = 'meeting',
      scope,
      deliverables,
      notes,
      tags
    } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: '服务标题不能为空' });
    }

    const priceNumber = Number(price);
    const durationNumber = Number(durationMinutes);
    if (!Number.isFinite(priceNumber) || priceNumber < 0 || !Number.isFinite(durationNumber) || durationNumber <= 0) {
      return res.status(400).json({ error: '价格或时长不合法' });
    }

    const service = await prisma.service.create({
      data: {
        consultantId: userId,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        price: priceNumber,
        currency: String(currency || 'CNY'),
        durationMinutes: durationNumber,
        deliveryType,
        scope: scope ? String(scope).trim() : null,
        deliverables: deliverables ? String(deliverables).trim() : null,
        notes: notes ? String(notes).trim() : null,
        tagsJson: JSON.stringify(tags || [])
      }
    });

    res.json({ ...service, tags: safeParseArray(service.tagsJson) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// List services by consultant
export const getServices = async (req: Request, res: Response) => {
  try {
    const { consultantId } = req.query;
    if (!consultantId) {
      return res.status(400).json({ error: 'consultantId is required' });
    }
    const services = await prisma.service.findMany({
      where: {
        consultantId: String(consultantId),
        isActive: true
      }
    });
    res.json(services.map((service: any) => ({ ...service, tags: safeParseArray(service.tagsJson) })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getServiceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        consultant: {
          select: {
            id: true,
            username: true,
            avatar: true,
            bio: true,
            isVerified: true
          }
        }
      }
    });
    if (!service || !service.isActive) {
      return res.status(404).json({ error: '服务不存在或已下架' });
    }
    res.json({ ...service, tags: safeParseArray(service.tagsJson) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateService = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '服务不存在或已下架' });
    if (existing.consultantId !== userId) {
      return res.status(403).json({ error: '无权限操作该服务' });
    }

    const {
      title,
      description,
      price,
      currency,
      durationMinutes,
      deliveryType,
      scope,
      deliverables,
      notes,
      tags,
      isActive
    } = req.body;

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: String(title).trim() } : {}),
        ...(description !== undefined ? { description: description ? String(description).trim() : null } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(currency !== undefined ? { currency: String(currency || 'CNY') } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes: Number(durationMinutes) } : {}),
        ...(deliveryType !== undefined ? { deliveryType } : {}),
        ...(scope !== undefined ? { scope: scope ? String(scope).trim() : null } : {}),
        ...(deliverables !== undefined ? { deliverables: deliverables ? String(deliverables).trim() : null } : {}),
        ...(notes !== undefined ? { notes: notes ? String(notes).trim() : null } : {}),
        ...(tags !== undefined ? { tagsJson: JSON.stringify(tags || []) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });

    res.json({ ...updated, tags: safeParseArray(updated.tagsJson) });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteService = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '服务不存在或已下架' });
    if (existing.consultantId !== userId) {
      return res.status(403).json({ error: '无权限操作该服务' });
    }
    await prisma.service.update({ where: { id }, data: { isActive: false } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Availability rules (weekly)
export const addAvailabilityRule = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { dayOfWeek, startTime, endTime } = req.body;
    const dayNumber = Number(dayOfWeek);

    if (!Number.isFinite(dayNumber) || dayNumber < 0 || dayNumber > 6 || !startTime || !endTime) {
      return res.status(400).json({ error: 'dayOfWeek/startTime/endTime 不合法' });
    }

    const rule = await prisma.availabilityRule.create({
      data: {
        consultantId: userId,
        dayOfWeek: dayNumber,
        startTime,
        endTime
      }
    });

    res.json(rule);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const listAvailabilityRules = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const rules = await prisma.availabilityRule.findMany({
      where: { consultantId: userId, isActive: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
    });
    res.json(rules);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAvailabilityRule = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const existing = await prisma.availabilityRule.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: '规则不存在' });
    if (existing.consultantId !== userId) {
      return res.status(403).json({ error: '无权限删除该规则' });
    }
    await prisma.availabilityRule.update({ where: { id }, data: { isActive: false } });
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
