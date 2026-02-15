import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { BookingsTable } from "./bookings-table";
import { AdminPageHeader } from "@/components/admin-page-header";

export default async function AdminBookingsPage() {
  await requireAdmin();

  const raw = await prisma.booking.findMany({
    orderBy: { startTime: "asc" },
    include: {
      room: { select: { name: true } },
      user: { select: { name: true, surname: true, email: true } },
    },
  });

  const now = new Date();
  const future = raw.filter((b) => b.startTime >= now).map((b) => ({
    id: b.id,
    startTime: b.startTime.toISOString(),
    endTime: b.endTime.toISOString(),
    roomName: b.room.name,
    userName: `${b.user.surname} ${b.user.name}`,
    userEmail: b.user.email,
    description: b.description,
  }));
  const past = raw
    .filter((b) => b.startTime < now)
    .reverse()
    .map((b) => ({
      id: b.id,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      roomName: b.room.name,
      userName: `${b.user.surname} ${b.user.name}`,
      userEmail: b.user.email,
      description: b.description,
    }));
  const bookings = [...future, ...past];

  return (
    <main className="min-h-screen p-6 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <AdminPageHeader titleKey="adminBookingsTitle" iconName="calendar-days" />
        <BookingsTable bookings={bookings} />
      </div>
    </main>
  );
}
