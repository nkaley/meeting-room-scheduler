"use client";

import { useState, useCallback } from "react";
import { ScheduleTimeline } from "@/components/schedule-timeline";
import { format, addDays } from "date-fns";
import { useLanguage } from "@/contexts/language-context";
import { parseLocalDate, toLocalDateString } from "@/lib/booking-utils";
import type { BookingItem, Room } from "@/components/schedule-timeline";
import type { ScheduleSettings } from "@/lib/settings";

type KioskViewProps = {
  room: Room;
  rooms: Room[];
  selectedDate: string;
  bookings: BookingItem[];
  settings: ScheduleSettings;
};

export function KioskView({
  room: initialRoom,
  rooms,
  selectedDate: initialDate,
  bookings: initialBookings,
  settings,
}: KioskViewProps) {
  const { t, dateFnsLocale } = useLanguage();
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoom.id);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [bookingsByRoomId, setBookingsByRoomId] = useState<Record<string, BookingItem[]>>(() => ({
    [initialRoom.id]: initialBookings,
  }));

  const refetchBookings = useCallback(async (roomId: string, date: string) => {
    const res = await fetch(`/api/kiosk?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(date)}`);
    const data = await res.json();
    setBookingsByRoomId((prev) => ({
      ...prev,
      [roomId]: Array.isArray(data) ? data : [],
    }));
  }, []);

  const handleRoomChange = (roomId: string) => {
    setSelectedRoomId(roomId);
    if (!(roomId in bookingsByRoomId)) {
      refetchBookings(roomId, selectedDate);
    }
  };

  const handleDateChange = (dateStr: string) => {
    setSelectedDate(dateStr);
    refetchBookings(selectedRoomId, dateStr);
  };

  const activeRoom = rooms.find((r) => r.id === selectedRoomId) ?? initialRoom;
  const bookings = bookingsByRoomId[activeRoom.id] ?? [];

  const selectedDay = new Date(selectedDate + "T12:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isToday = selectedDate === format(today, "yyyy-MM-dd");
  const isTomorrow = selectedDate === format(tomorrow, "yyyy-MM-dd");

  return (
    <main className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">{activeRoom.name}</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-sm hover:bg-muted"
                onClick={() => {
                  let d = parseLocalDate(selectedDate);
                  d.setDate(d.getDate() - 1);
                  while (!settings.workDays.includes(d.getDay())) d.setDate(d.getDate() - 1);
                  handleDateChange(toLocalDateString(d));
                }}
              >
                ‹
              </button>
              <span className="min-w-[120px] text-center text-muted-foreground">
                {isToday ? t("today") : isTomorrow ? t("tomorrow") : format(selectedDay, "d MMM yyyy", { locale: dateFnsLocale })}
              </span>
              <button
                type="button"
                className="rounded border bg-background px-2 py-1 text-sm hover:bg-muted"
                onClick={() => {
                  let d = parseLocalDate(selectedDate);
                  d.setDate(d.getDate() + 1);
                  while (!settings.workDays.includes(d.getDay())) d.setDate(d.getDate() + 1);
                  handleDateChange(toLocalDateString(d));
                }}
              >
                ›
              </button>
            </div>
            {rooms.length > 1 && (
              <select
                className="rounded-md border bg-background px-2 py-1 text-sm"
                value={selectedRoomId}
                onChange={(e) => handleRoomChange(e.target.value)}
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}
          </div>
        </div>
        <ScheduleTimeline
          room={activeRoom}
          bookings={bookings}
          selectedDate={selectedDate}
          currentUserId=""
          isAdmin={false}
          onBookingsChange={() => refetchBookings(selectedRoomId, selectedDate)}
          settings={settings}
          isKiosk
        />
      </div>
    </main>
  );
}
