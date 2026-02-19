import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { getOrCreateSettings } from "../lib/settings.js";
import {
  getDayBoundsInTimezone,
  getLocalPartsInTimezone,
  slotEnd,
  intervalsOverlap,
  addDays,
  startOfDay,
} from "../lib/booking-utils.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

const router = Router();
const BOOKING_DESCRIPTION_MAX = 150;

// GET /api/bookings?roomId=&date=
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  const roomId = req.query.roomId as string;
  const dateStr = req.query.date as string;
  if (!roomId || !dateStr) {
    res.status(400).json({ error: "roomId and date required" });
    return;
  }
  const settings = await getOrCreateSettings();
  const tz = settings.timezone?.trim() || "UTC";
  const { dayStart, dayEnd } = getDayBoundsInTimezone(
    dateStr,
    tz,
    settings.workStartHour,
    settings.workEndHour
  );

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    include: { user: { select: { name: true, surname: true } } },
    orderBy: { startTime: "asc" },
  });

  res.json(
    bookings.map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      description: b.description,
      userName: `${b.user.surname} ${b.user.name}`,
      userId: b.userId,
    }))
  );
});

const createBookingSchema = z.object({
  roomId: z.string().min(1),
  startTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  description: z.string().max(BOOKING_DESCRIPTION_MAX).optional().nullable(),
});

// POST /api/bookings
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: { userId: string } }).user;
  const parsed = createBookingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please specify room, time and duration" });
    return;
  }

  const settings = await getOrCreateSettings();
  const { roomId, startTime: startTimeStr, durationMinutes, description } = parsed.data;
  const rawDesc = description?.trim() || null;
  const desc =
    rawDesc && rawDesc.length > BOOKING_DESCRIPTION_MAX
      ? rawDesc.slice(0, BOOKING_DESCRIPTION_MAX)
      : rawDesc;

  if (settings.requireDescription && !desc) {
    res.status(400).json({ error: "Please add a description or meeting purpose" });
    return;
  }

  const startTime = new Date(startTimeStr);
  const endTime = slotEnd(startTime, durationMinutes);

  const maxDuration = settings.maxBookingDurationMinutes ?? 120;
  if (
    durationMinutes > maxDuration ||
    durationMinutes < settings.bookingStepMinutes
  ) {
    res.status(400).json({ error: "Duration must be between 30 min and 2 hours" });
    return;
  }

  const today = startOfDay(new Date());
  const maxDate = addDays(today, settings.maxBookingDistanceDays);
  if (startTime < today) {
    res.status(400).json({ error: "Cannot book in the past" });
    return;
  }
  if (startTime >= maxDate) {
    res.status(400).json({ error: "Booking is only available for the next 14 days" });
    return;
  }

  const tz = settings.timezone?.trim() || "UTC";
  const startLocal = getLocalPartsInTimezone(startTime, tz);
  const endLocal = getLocalPartsInTimezone(endTime, tz);
  const startInRange =
    startLocal.hour > settings.workStartHour ||
    (startLocal.hour === settings.workStartHour && startLocal.minute >= 0);
  const endInRange =
    endLocal.hour < settings.workEndHour ||
    (endLocal.hour === settings.workEndHour && endLocal.minute === 0);
  if (!startInRange || !endInRange) {
    res.status(400).json({ error: "Time must be within working hours" });
    return;
  }
  if (!settings.workDays.includes(startLocal.dayOfWeek)) {
    res.status(400).json({ error: "Weekends are not available for booking" });
    return;
  }

  const existing = await prisma.booking.findMany({
    where: { roomId },
    select: { startTime: true, endTime: true },
  });
  for (const b of existing) {
    if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
      res
        .status(409)
        .json({
          error: "This slot is already taken or overlaps with another booking",
        });
      return;
    }
  }

  await prisma.booking.create({
    data: {
      userId: user.userId,
      roomId,
      startTime,
      endTime,
      description: desc,
    },
  });
  res.status(201).json({ success: true });
});

// DELETE /api/bookings/:id
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  const user = (req as Request & { user: { userId: string; role: string } }).user;
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  });
  if (!booking) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  const isAdmin = user.role === "ADMIN";
  const isOwner = booking.userId === user.userId;
  if (!isAdmin && !isOwner) {
    res.status(403).json({ error: "You can only cancel your own bookings" });
    return;
  }
  if (booking.startTime < new Date() && !isAdmin) {
    res.status(400).json({ error: "Cannot cancel a past booking" });
    return;
  }
  await prisma.booking.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export default router;
