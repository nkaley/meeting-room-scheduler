"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { DashboardHeader } from "./dashboard-header";
import { DateNav } from "./date-nav";
import { ScheduleTimeline } from "./schedule-timeline";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/language-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { BookingItem, Room } from "./schedule-timeline";
import type { ScheduleSettings } from "@/lib/settings";

type DashboardClientProps = {
  rooms: Room[];
  initialDate: string;
  initialBookingsByRoomId: Record<string, BookingItem[]>;
  currentUserId: string;
  user: { name?: string | null; email?: string | null; image?: string | null; role?: string };
  isAdmin: boolean;
  settings: ScheduleSettings;
};

export function DashboardClient({
  rooms,
  initialDate,
  initialBookingsByRoomId,
  currentUserId,
  user,
  isAdmin,
  settings,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;

  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id ?? "");
  const [bookingsByRoomId, setBookingsByRoomId] = useState(initialBookingsByRoomId);

  const refetchBookings = useCallback(async () => {
    if (!selectedRoomId || !token) return;
    const { data } = await api.get<BookingItem[]>(
      `/api/bookings?roomId=${encodeURIComponent(selectedRoomId)}&date=${encodeURIComponent(selectedDate)}`,
      token
    );
    setBookingsByRoomId((prev) => ({
      ...prev,
      [selectedRoomId]: Array.isArray(data) ? data : [],
    }));
  }, [selectedRoomId, selectedDate, token]);

  const handleDateChange = useCallback(
    (dateStr: string) => {
      setSelectedDate(dateStr);
      const roomId = selectedRoomId || rooms[0]?.id;
      if (roomId && token) {
        api
          .get<BookingItem[]>(
            `/api/bookings?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(dateStr)}`,
            token
          )
          .then(({ data }) => {
            setBookingsByRoomId((prev) => ({
              ...prev,
              [roomId]: Array.isArray(data) ? data : [],
            }));
          });
      }
    },
    [selectedRoomId, rooms, token]
  );

  const handleRoomChange = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId);
      if (
        (!(roomId in bookingsByRoomId) || bookingsByRoomId[roomId].length === 0) &&
        token
      ) {
        api
          .get<BookingItem[]>(
            `/api/bookings?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(selectedDate)}`,
            token
          )
          .then(({ data }) => {
            setBookingsByRoomId((prev) => ({
              ...prev,
              [roomId]: Array.isArray(data) ? data : [],
            }));
          });
      }
    },
    [selectedDate, bookingsByRoomId, token]
  );

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) ?? rooms[0];
  const bookings = activeRoom ? bookingsByRoomId[activeRoom.id] ?? [] : [];

  const { t } = useLanguage();
  if (rooms.length === 0) return null;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <DashboardHeader user={user} isAdmin={isAdmin} />
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <aside className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-700">{t("roomsTitle")}</h2>
            <div className="md:hidden">
              <Select value={selectedRoomId} onValueChange={handleRoomChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("roomsTitle")} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <nav className="hidden flex-col gap-0.5 md:flex">
              {rooms.map((room) => (
                <Button
                  key={room.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start rounded-r-md border-l-4 border-transparent p-3 text-left font-normal transition-colors",
                    selectedRoomId === room.id
                      ? "border-indigo-600 bg-white font-semibold text-slate-900 shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  )}
                  onClick={() => handleRoomChange(room.id)}
                >
                  <span className="truncate">{room.name}</span>
                </Button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 space-y-4">
            <DateNav
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              settings={settings}
            />
            <ScheduleTimeline
              room={activeRoom}
              bookings={bookings}
              selectedDate={selectedDate}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onBookingsChange={refetchBookings}
              settings={settings}
              token={token ?? undefined}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
