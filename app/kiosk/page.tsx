import { getOrCreateSettings } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { startOfDay, setHours, setMinutes, addDays } from "date-fns";
import { isWorkDay } from "@/lib/booking-utils";
import { KioskView } from "./kiosk-view";

function getInitialDate(workDays: number[]): string {
  let d = startOfDay(new Date());
  while (!workDays.includes(d.getDay())) {
    d = addDays(d, 1);
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default async function KioskPage() {
  const [settings, rooms] = await Promise.all([
    getOrCreateSettings(),
    prisma.room.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (rooms.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-lg text-muted-foreground">No active rooms.</p>
      </main>
    );
  }

  const initialDate = getInitialDate(settings.workDays);
  const firstRoom = rooms[0];
  const [y, mo, dayNum] = initialDate.split("-").map(Number);
  const dayStart = setMinutes(setHours(new Date(y, Number(mo) - 1, dayNum), settings.workStartHour), 0);
  const dayEnd = setMinutes(setHours(new Date(y, Number(mo) - 1, dayNum), settings.workEndHour), 0);

  const bookings = await prisma.booking.findMany({
    where: {
      roomId: firstRoom.id,
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    include: { user: { select: { name: true, surname: true } } },
    orderBy: { startTime: "asc" },
  });

  const bookingsForClient = bookings.map((b) => ({
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    userName: `${b.user.surname} ${b.user.name}`,
    userId: b.userId,
    description: b.description,
  }));

  return (
    <KioskView
      room={{ id: firstRoom.id, name: firstRoom.name }}
      rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
      selectedDate={initialDate}
      bookings={bookingsForClient}
      settings={settings}
    />
  );
}
