import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSettings } from "@/lib/settings";
import { DashboardClient } from "@/components/dashboard-client";
import { NoRoomsMessage } from "@/components/no-rooms-message";
import { startOfDay, setHours, setMinutes, addDays } from "date-fns";
import { isWorkDay } from "@/lib/booking-utils";
import type { ScheduleSettings } from "@/lib/settings";

function getInitialDate(settings: ScheduleSettings): string {
  let d = startOfDay(new Date());
  while (!isWorkDay(d, settings)) {
    d = addDays(d, 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dayNum = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dayNum}`;
}

function mapBooking(b: {
  id: string;
  startTime: Date;
  endTime: Date;
  userId: string;
  description: string | null;
  user: { name: string; surname: string };
}) {
  return {
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    userName: `${b.user.surname} ${b.user.name}`,
    userId: b.userId,
    description: b.description,
  };
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const [rooms, settings] = await Promise.all([
    prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getOrCreateSettings(),
  ]);

  const initialDate = getInitialDate(settings);
  const [y, mo, dayNum] = initialDate.split("-").map(Number);
  const today = new Date(y, mo - 1, dayNum);
  const dayEnd = setMinutes(setHours(today, settings.workEndHour), 0);

  const firstRoomId = rooms[0]?.id;
  const initialBookingsByRoomId: Record<string, ReturnType<typeof mapBooking>[]> = {};

  if (firstRoomId) {
    const list = await prisma.booking.findMany({
      where: {
        roomId: firstRoomId,
        startTime: { lt: dayEnd },
        endTime: { gt: today },
      },
      include: { user: { select: { name: true, surname: true } } },
      orderBy: { startTime: "asc" },
    });
    initialBookingsByRoomId[firstRoomId] = list.map(mapBooking);
  }

  if (rooms.length === 0) {
    return (
      <NoRoomsMessage isAdmin={session.user?.role === "ADMIN"} />
    );
  }

  return (
    <DashboardClient
      rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
      initialDate={initialDate}
      initialBookingsByRoomId={initialBookingsByRoomId}
      currentUserId={session.user?.id ?? ""}
      user={{
        name: session.user?.name ?? null,
        email: session.user?.email ?? null,
        image: null,
        role: session.user?.role ?? undefined,
      }}
      isAdmin={session.user?.role === "ADMIN"}
      settings={settings}
    />
  );
}
