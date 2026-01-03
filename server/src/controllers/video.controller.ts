import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import type { Booking, VideoRoom } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key';
const READY_WINDOW_MINUTES = 10;
const POST_WINDOW_MINUTES = 15;

const buildRoomNumber = () => `ROOM-${Date.now()}`;

const getBookingForRoom = async (roomId: string): Promise<Booking | null> => {
  return prisma.booking.findFirst({ where: { roomId } });
};

const isBookingParticipant = (booking: any, userId: string) => {
  return booking.requesterId === userId || booking.consultantId === userId;
};

const getJoinWindow = (startAt?: Date | null, endAt?: Date | null, now = new Date()) => {
  if (!startAt) return { allowed: true, ready: true };
  const readyAt = new Date(startAt.getTime() - READY_WINDOW_MINUTES * 60000);
  const endWindow = endAt ? new Date(endAt.getTime() + POST_WINDOW_MINUTES * 60000) : null;
  if (now < readyAt) return { allowed: false, reason: 'too_early' };
  if (endWindow && now > endWindow) return { allowed: false, reason: 'expired' };
  return { allowed: true, ready: now >= readyAt };
};

type RoomAccessResult =
  | { ok: true; room: VideoRoom; booking: Booking | null }
  | { ok: false; status: number; error: string };

const isRoomAccessOk = (result: RoomAccessResult): result is { ok: true; room: VideoRoom; booking: Booking | null } =>
  result.ok === true;

const ensureRoomAccess = async (roomId: string, userId: string): Promise<RoomAccessResult> => {
  const room = await prisma.videoRoom.findUnique({ where: { id: roomId } });
  if (!room) return { ok: false, status: 404, error: 'Room not found' };

  const booking = await getBookingForRoom(roomId);
  if (booking) {
    if (!isBookingParticipant(booking, userId)) {
      return { ok: false, status: 403, error: 'Not allowed to access this room' };
    }
    return { ok: true, room, booking };
  }

  if (room.hostId !== userId) {
    const participant = await prisma.roomParticipant.findUnique({
      where: { roomId_userId: { roomId, userId } }
    });
    if (!participant) {
      return { ok: false, status: 403, error: 'Not allowed to access this room' };
    }
  }

  return { ok: true, room, booking: null };
};

export const createRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      title,
      description,
      password,
      scheduledAt,
      linkType = 'permanent',
      joinPermission = 'invited',
      enableWaitingRoom = false,
      enableRecording = false,
      enableWhiteboard = true,
      enableScreenShare = true,
      enableBarrage = true,
      maxParticipants = 100
    } = req.body || {};

    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'title is required' });
    }

    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null;
    const isScheduled = scheduledDate && !Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() > Date.now();

    const room = await prisma.videoRoom.create({
      data: {
        hostId: userId,
        roomNumber: buildRoomNumber(),
        title: String(title).trim(),
        description: description ? String(description) : null,
        password: password ? String(password) : null,
        linkType,
        joinPermission,
        enableWaitingRoom: Boolean(enableWaitingRoom),
        enableRecording: Boolean(enableRecording),
        enableWhiteboard: Boolean(enableWhiteboard),
        enableScreenShare: Boolean(enableScreenShare),
        enableBarrage: Boolean(enableBarrage),
        maxParticipants: Number(maxParticipants) || 100,
        status: isScheduled ? 'scheduled' : 'active',
        scheduledAt: isScheduled ? scheduledDate! : null,
        startedAt: isScheduled ? null : new Date()
      }
    });

    res.status(201).json(room);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await ensureRoomAccess(id, userId);
    if (!isRoomAccessOk(result)) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.room);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const getRoomByNumber = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { roomNumber } = req.params;

    const room = await prisma.videoRoom.findUnique({ where: { roomNumber } });
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const result = await ensureRoomAccess(room.id, userId);
    if (!isRoomAccessOk(result)) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(room);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await ensureRoomAccess(id, userId);
    if (!isRoomAccessOk(result)) {
      return res.status(result.status).json({ error: result.error });
    }

    const { room, booking } = result;

    if (room.status === 'ended' || room.status === 'cancelled') {
      return res.status(400).json({ error: 'Room is not available' });
    }

    if (booking) {
      if (booking.status === 'pending_payment') {
        return res.status(403).json({ error: 'Booking not paid' });
      }
      if (['cancelled', 'refunded', 'refunding', 'dispute'].includes(booking.status)) {
        return res.status(403).json({ error: 'Booking is not active' });
      }

      const windowCheck = getJoinWindow(booking.startAt, booking.endAt);
      if (!windowCheck.allowed) {
        const reason = windowCheck.reason === 'too_early' ? 'Too early to join' : 'Meeting window ended';
        return res.status(403).json({ error: reason });
      }

      if (booking.status === 'paid' && windowCheck.ready) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: 'ready' }
        });
      }
    }

    const participant = await prisma.roomParticipant.upsert({
      where: { roomId_userId: { roomId: room.id, userId } },
      create: { roomId: room.id, userId, role: room.hostId === userId ? 'host' : 'participant' },
      update: { leftAt: null }
    });

    const now = new Date();
    const defaultExpiry = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const tokenExpiryBase = booking?.endAt ? new Date(booking.endAt.getTime() + POST_WINDOW_MINUTES * 60000) : defaultExpiry;
    const ttlSeconds = Math.max(60, Math.floor((tokenExpiryBase.getTime() - now.getTime()) / 1000));
    const roomToken = jwt.sign({ roomId: room.id, userId }, JWT_SECRET, { expiresIn: ttlSeconds });

    res.json({ room, participant, token: roomToken, waitingRoomEnabled: room.enableWaitingRoom });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const startRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const room = await prisma.videoRoom.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.hostId !== userId) return res.status(403).json({ error: 'Only host can start the room' });

    const updated = await prisma.videoRoom.update({
      where: { id },
      data: { status: 'active', startedAt: new Date() }
    });

    const booking = await getBookingForRoom(id);
    if (booking && !['in_progress', 'completed'].includes(booking.status)) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'in_progress', startedAt: new Date() }
      });
    }

    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const endRoom = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const room = await prisma.videoRoom.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.hostId !== userId) return res.status(403).json({ error: 'Only host can end the room' });

    const updated = await prisma.videoRoom.update({
      where: { id },
      data: { status: 'ended', endedAt: new Date() }
    });

    const booking = await getBookingForRoom(id);
    if (booking && booking.status !== 'completed') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'completed', completedAt: new Date() }
      });
    }

    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const startRecording = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const room = await prisma.videoRoom.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.hostId !== userId) return res.status(403).json({ error: 'Only host can start recording' });

    const updated = await prisma.videoRoom.update({
      where: { id },
      data: { enableRecording: true }
    });

    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

export const stopRecording = async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;
    const { recordingUrl } = req.body || {};

    const room = await prisma.videoRoom.findUnique({ where: { id } });
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.hostId !== userId) return res.status(403).json({ error: 'Only host can stop recording' });

    const updated = await prisma.videoRoom.update({
      where: { id },
      data: {
        enableRecording: false,
        recordingUrl: recordingUrl ? String(recordingUrl) : room.recordingUrl
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
