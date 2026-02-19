import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { api } from "@/lib/api";
import { DashboardClient } from "@/components/dashboard-client";
import { NoRoomsMessage } from "@/components/no-rooms-message";
import { startOfDay, addDays } from "date-fns";
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

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const token = (session as { accessToken?: string }).accessToken;
  if (!token) redirect("/login");

  const [roomsRes, settingsRes] = await Promise.all([
    api.get<{ id: string; name: string; description?: string | null; isActive?: boolean }[]>("/api/rooms", token),
    api.get<ScheduleSettings>("/api/settings", token),
  ]);

  const allRooms = roomsRes.data ?? [];
  const settings = settingsRes.data;
  if (!settings) redirect("/login");

  const activeRooms = allRooms.filter((r) => r !== null && r.isActive !== false);
  const initialDate = getInitialDate(settings);
  const firstRoomId = activeRooms[0]?.id;
  const initialBookingsByRoomId: Record<string, { id: string; startTime: string; endTime: string; userName: string; userId: string; description: string | null }[]> = {};

  if (firstRoomId) {
    const bookRes = await api.get<{ id: string; startTime: string; endTime: string; userName: string; userId: string; description: string | null }[]>(
      `/api/bookings?roomId=${encodeURIComponent(firstRoomId)}&date=${encodeURIComponent(initialDate)}`,
      token
    );
    initialBookingsByRoomId[firstRoomId] = Array.isArray(bookRes.data) ? bookRes.data : [];
  }

  if (activeRooms.length === 0) {
    return <NoRoomsMessage isAdmin={session.user?.role === "ADMIN"} />;
  }

  return (
    <DashboardClient
      rooms={activeRooms.map((r) => ({ id: r.id, name: r.name }))}
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
