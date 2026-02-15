import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/settings";
import { startOfDay, setHours, setMinutes } from "date-fns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const dateStr = searchParams.get("date");

  if (!roomId || !dateStr) {
    return NextResponse.json({ error: "roomId and date required" }, { status: 400 });
  }

  const settings = await getOrCreateSettings();
  const [y, mo, dayNum] = dateStr.split("-").map(Number);
  const dayStart = setMinutes(setHours(new Date(y, (mo ?? 1) - 1, dayNum ?? 1), settings.workStartHour), 0);
  const dayEnd = setMinutes(setHours(new Date(y, (mo ?? 1) - 1, dayNum ?? 1), settings.workEndHour), 0);

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    include: { user: { select: { name: true, surname: true } } },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(
    bookings.map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      userName: `${b.user.surname} ${b.user.name}`,
      userId: b.userId,
      description: b.description,
    }))
  );
}
