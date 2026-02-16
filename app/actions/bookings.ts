"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/settings";
import { intervalsOverlap, slotEnd, getLocalPartsInTimezone } from "@/lib/booking-utils";
import { addDays, startOfDay } from "date-fns";

export async function createBooking(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const settings = await getOrCreateSettings();

  const roomId = formData.get("roomId") as string;
  const startTimeRaw = formData.get("startTime") as string;
  const durationMinutes = Number(formData.get("durationMinutes"));
  const rawDesc = (formData.get("description") as string)?.trim() || null;
  const BOOKING_DESCRIPTION_MAX = 150;
  const description = rawDesc && rawDesc.length > BOOKING_DESCRIPTION_MAX ? rawDesc.slice(0, BOOKING_DESCRIPTION_MAX) : rawDesc;

  if (!roomId || !startTimeRaw || !durationMinutes) {
    return { error: "Please specify room, time and duration" };
  }

  if (settings.requireDescription && !description) {
    return { error: "Please add a description or meeting purpose" };
  }

  const startTime = new Date(startTimeRaw);
  const endTime = slotEnd(startTime, durationMinutes);

  const maxDuration = settings.maxBookingDurationMinutes ?? 120;
  if (durationMinutes > maxDuration || durationMinutes < settings.bookingStepMinutes) {
    return { error: "Duration must be between 30 min and 2 hours" };
  }

  const today = startOfDay(new Date());
  const maxDate = addDays(today, settings.maxBookingDistanceDays);
  if (startTime < today) {
    return { error: "Cannot book in the past" };
  }
  if (startTime >= maxDate) {
    return { error: "Booking is only available for the next 14 days" };
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
    return { error: "Time must be within working hours" };
  }

  if (!settings.workDays.includes(startLocal.dayOfWeek)) {
    return { error: "Weekends are not available for booking" };
  }

  const existing = await prisma.booking.findMany({
    where: { roomId },
    select: { startTime: true, endTime: true },
  });

  for (const b of existing) {
    if (intervalsOverlap(startTime, endTime, b.startTime, b.endTime)) {
      return { error: "This slot is already taken or overlaps with another booking" };
    }
  }

  await prisma.booking.create({
    data: {
      userId: session.user.id,
      roomId,
      startTime,
      endTime,
      description,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function cancelBooking(bookingId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { user: true },
  });
  if (!booking) {
    return { error: "Booking not found" };
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = booking.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return { error: "You can only cancel your own bookings" };
  }

  if (booking.startTime < new Date() && !isAdmin) {
    return { error: "Cannot cancel a past booking" };
  }

  await prisma.booking.delete({ where: { id: bookingId } });
  revalidatePath("/");
  revalidatePath("/admin/rooms");
  return { success: true };
}
