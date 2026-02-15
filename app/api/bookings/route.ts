import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/settings";
import { startOfDay, setHours, setMinutes } from "date-fns";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const dateStr = searchParams.get("date");

  if (!roomId || !dateStr) {
    return NextResponse.json({ error: "roomId and date required" }, { status: 400 });
  }

  const settings = await getOrCreateSettings();
  const date = startOfDay(new Date(dateStr));
  const dayStart = setMinutes(setHours(date, settings.workStartHour), 0);
  const dayEnd = setMinutes(setHours(date, settings.workEndHour), 0);

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    include: {
      user: { select: { name: true, surname: true } },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      description: b.description,
      userName: `${b.user.surname} ${b.user.name}`,
      userId: b.userId,
    }))
  );
}
