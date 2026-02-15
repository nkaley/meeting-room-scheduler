"use client";

import { useState, useMemo } from "react";
import {
  getSlotsForDay,
  getSelectableDays,
  formatSlotTime,
  formatDayLabel,
  parseLocalDate,
  toLocalDateString,
  DURATION_OPTIONS,
  intervalsOverlap,
} from "@/lib/booking-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createBooking } from "@/app/actions/bookings";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { ScheduleSettings } from "@/lib/settings";
import { LogOut, Shield } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type Room = { id: string; name: string; description: string | null };
type BookingItem = {
  id: string;
  startTime: string;
  endTime: string;
  userName: string;
  userId: string;
  description: string | null;
};

const SLOT_MS = 30 * 60 * 1000;

function slotCoveredBy(
  slotStart: Date,
  slotEndTime: Date,
  bookings: BookingItem[]
): BookingItem | null {
  for (const b of bookings) {
    if (
      intervalsOverlap(
        slotStart,
        slotEndTime,
        new Date(b.startTime),
        new Date(b.endTime)
      )
    ) {
      return b;
    }
  }
  return null;
}

export function Calendar({
  rooms,
  initialRoomId,
  initialBookings,
  initialDate,
  isAdmin,
  settings,
}: {
  rooms: Room[];
  initialRoomId: string;
  initialBookings: BookingItem[];
  initialDate: string;
  isAdmin: boolean;
  settings: ScheduleSettings;
}) {
  const { t } = useLanguage();
  const selectableDays = useMemo(() => getSelectableDays(settings), [settings]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [bookings, setBookings] = useState<BookingItem[]>(initialBookings);
  const [loading, setLoading] = useState(false);
  const [modalSlot, setModalSlot] = useState<{ start: Date; roomId: string } | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [description, setDescription] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const selectedDay = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const slots = useMemo(() => getSlotsForDay(selectedDay, settings), [selectedDay, settings]);
  const isWeekend = selectedDay.getDay() === 0 || selectedDay.getDay() === 6;

  async function refetchBookings() {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bookings?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(selectedDate)}`
      );
      const data = await res.json();
      if (Array.isArray(data)) setBookings(data);
    } finally {
      setLoading(false);
    }
  }

  function onRoomChange(newRoomId: string) {
    setRoomId(newRoomId);
    fetch(
      `/api/bookings?roomId=${encodeURIComponent(newRoomId)}&date=${encodeURIComponent(selectedDate)}`
    )
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setBookings(data) : null));
  }

  function onDateChange(dateStr: string) {
    setSelectedDate(dateStr);
    fetch(
      `/api/bookings?roomId=${encodeURIComponent(roomId)}&date=${encodeURIComponent(dateStr)}`
    )
      .then((r) => r.json())
      .then((data) => (Array.isArray(data) ? setBookings(data) : null));
  }

  async function handleSubmitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (!modalSlot) return;
    setSubmitError(null);
    const formData = new FormData();
    formData.set("roomId", modalSlot.roomId);
    formData.set("startTime", modalSlot.start.toISOString());
    formData.set("durationMinutes", String(durationMinutes));
    formData.set("description", description);
    const result = await createBooking(formData);
    if (result?.error) {
      setSubmitError(result.error);
      return;
    }
    setModalSlot(null);
    setDescription("");
    setDurationMinutes(60);
    refetchBookings();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
        <h1 className="text-2xl font-bold">{t("schedule")}</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link href="/admin/rooms">
              <Button variant="outline" size="sm">
                <Shield className="mr-2 h-4 w-4" />
                {t("adminRoomsTitle")}
              </Button>
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                {t("adminUsersTitle")}
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("navLogout")}
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <Label>{t("room")}</Label>
          <Select value={roomId} onValueChange={onRoomChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={t("room")} />
            </SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t("time")}</Label>
          <Select value={selectedDate} onValueChange={onDateChange}>
            <SelectTrigger className="w-[220px]">
              <SelectValue>{selectedDate ? formatDayLabel(selectedDay) : t("time")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {selectableDays.map((d) => {
                const dateStr = toLocalDateString(d);
                return (
                  <SelectItem key={dateStr} value={dateStr}>
                    {formatDayLabel(d)}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isWeekend ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          {t("weekendUnavailable")}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded border-2 border-primary/30 bg-background" />
              {t("free")}
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 rounded bg-red-200" />
              {t("busy")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {slots.map((slotStart) => {
              const end = new Date(slotStart.getTime() + SLOT_MS);
              const booking = slotCoveredBy(slotStart, end, bookings);
              const isClickable = !booking && !loading;
              return (
                <div
                  key={slotStart.toISOString()}
                  className={cn(
                    "flex aspect-square min-h-[88px] flex-col justify-between rounded-lg border-2 p-2 transition-colors",
                    booking
                      ? "border-red-300 bg-red-100 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
                      : isClickable
                        ? "cursor-pointer border-dashed border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
                        : "border-muted bg-muted/30"
                  )}
                  onClick={() => {
                    if (isClickable) {
                      setModalSlot({ start: new Date(slotStart), roomId });
                      setSubmitError(null);
                    }
                  }}
                  role={isClickable ? "button" : undefined}
                >
                  <span className="text-xs font-medium tabular-nums text-muted-foreground">
                    {formatSlotTime(slotStart)}
                  </span>
                  <span className="min-h-0 flex-1 overflow-hidden text-center text-sm leading-tight">
                    {booking ? (
                      <>
                        <span className="font-medium">{booking.userName}</span>
                        {booking.description && (
                          <span className="mt-0.5 block truncate text-xs opacity-90">
                            {booking.description}
                          </span>
                        )}
                      </>
                    ) : isClickable ? (
                      <span className="text-muted-foreground">+ {t("bookSlot")}</span>
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!modalSlot} onOpenChange={(open) => !open && setModalSlot(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newBooking")}</DialogTitle>
          </DialogHeader>
          {modalSlot && (
            <form onSubmit={handleSubmitBooking} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("start")}: {formatSlotTime(modalSlot.start)}
              </p>
              {submitError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {submitError}
                </p>
              )}
              <div className="space-y-2">
                <Label>{t("duration")}</Label>
                <Select
                  value={String(durationMinutes)}
                  onValueChange={(v) => setDurationMinutes(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.minutes} value={String(opt.minutes)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("description")}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t("descriptionPlaceholder")}
                  rows={2}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setModalSlot(null)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">{t("book")}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
