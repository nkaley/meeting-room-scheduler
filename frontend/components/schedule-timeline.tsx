"use client";

import { useState, useMemo } from "react";
import {
  getSlotsForDay,
  formatSlotTime,
  parseLocalDate,
  getDurationOptions,
  intervalsOverlap,
} from "@/lib/booking-utils";
import { Card, CardContent } from "@/components/ui/card";
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
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import type { ScheduleSettings } from "@/lib/settings";

const ROW_HEIGHT = 80;

export type Room = { id: string; name: string };
export type BookingItem = {
  id: string;
  startTime: string;
  endTime: string;
  userName: string;
  userId: string;
  description: string | null;
};

function slotCoveredBy(
  slotStart: Date,
  slotEnd: Date,
  bookings: BookingItem[]
): BookingItem | null {
  for (const b of bookings) {
    if (
      intervalsOverlap(
        slotStart,
        slotEnd,
        new Date(b.startTime),
        new Date(b.endTime)
      )
    ) return b;
  }
  return null;
}

function formatTimeRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${formatSlotTime(s)} – ${formatSlotTime(e)}`;
}

type ScheduleTimelineProps = {
  room: Room;
  bookings: BookingItem[];
  selectedDate: string;
  currentUserId: string;
  isAdmin: boolean;
  onBookingsChange: () => void;
  settings: ScheduleSettings;
  token?: string;
};

export function ScheduleTimeline({
  room,
  bookings,
  selectedDate,
  currentUserId,
  isAdmin,
  onBookingsChange,
  settings,
  token,
}: ScheduleTimelineProps) {
  const { t } = useLanguage();
  const selectedDay = useMemo(() => parseLocalDate(selectedDate), [selectedDate]);
  const slots = useMemo(() => getSlotsForDay(selectedDay, settings), [selectedDay, settings]);
  const durationOptions = useMemo(() => getDurationOptions(settings), [settings]);
  const slotMs = settings.bookingStepMinutes * 60 * 1000;
  const isWorkDay = settings.workDays.includes(selectedDay.getDay());

  const [createOpen, setCreateOpen] = useState(false);
  const [createStart, setCreateStart] = useState<Date | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [description, setDescription] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);

  const [viewBooking, setViewBooking] = useState<BookingItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const openCreate = (start: Date) => {
    setCreateStart(start);
    setCreateError(null);
    setDescription("");
    setDurationMinutes(durationOptions[0]?.minutes ?? 60);
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createStart || !token) return;
    setCreateError(null);
    const { error } = await api.post(
      "/api/bookings",
      {
        roomId: room.id,
        startTime: createStart.toISOString(),
        durationMinutes,
        description: description.trim() || null,
      },
      token
    );
    if (error) {
      setCreateError(error);
      return;
    }
    setCreateOpen(false);
    onBookingsChange();
  };

  const handleCancelBooking = async () => {
    if (!viewBooking || !token) return;
    setCancelError(null);
    setCancelLoading(true);
    const { error } = await api.delete(`/api/bookings/${viewBooking.id}`, token);
    setCancelLoading(false);
    if (error) {
      setCancelError(error);
      return;
    }
    setViewBooking(null);
    onBookingsChange();
  };

  if (!isWorkDay) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        {t("weekendUnavailable")}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[80px_1fr] gap-px border-slate-100">
          <div className="rounded-tl-xl bg-slate-50 py-3 text-center text-xs font-medium text-slate-500">
            {t("time")}
          </div>
          <div className="rounded-tr-xl bg-slate-50 py-3 text-center text-sm font-medium text-slate-800">
            {room.name}
          </div>

          {slots.map((slotStart) => {
            const end = new Date(slotStart.getTime() + slotMs);
            const booking = slotCoveredBy(slotStart, end, bookings);
            return (
              <div key={slotStart.toISOString()} className="contents">
                <div
                  className="flex min-h-[80px] items-center justify-center border-b border-dashed border-slate-100 bg-slate-50/50 px-2 py-2 text-sm tabular-nums text-slate-400"
                  style={{ minHeight: ROW_HEIGHT }}
                >
                  {formatSlotTime(slotStart)}
                </div>
                <SlotCell
                  booking={booking}
                  currentUserId={currentUserId}
                  onFreeClick={() => openCreate(new Date(slotStart))}
                  onBookingClick={
                    booking && (booking.userId === currentUserId || isAdmin)
                      ? () => setViewBooking(booking)
                      : undefined
                  }
                  bookSlotLabel={t("bookSlot")}
                />
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newBooking")}</DialogTitle>
          </DialogHeader>
          {createStart && (
            <form onSubmit={handleCreate} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("start")}: {formatSlotTime(createStart)}
              </p>
              {createError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {createError}
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
                    {durationOptions.map((opt) => {
                      const m = opt.minutes;
                      const label = m < 60
                        ? `${m} ${t("durationMin")}`
                        : m === 60
                          ? `1 ${t("durationHour")}`
                          : `${m / 60} ${t("durationHour")}`;
                      return (
                        <SelectItem key={m} value={String(m)}>
                          {label}
                        </SelectItem>
                      );
                    })}
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
                  maxLength={150}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  {t("cancel")}
                </Button>
                <Button type="submit">{t("book")}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewBooking} onOpenChange={(open) => !open && setViewBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {viewBooking?.userId === currentUserId ? t("myBooking") : t("booking")}
            </DialogTitle>
          </DialogHeader>
          {viewBooking && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {formatTimeRange(viewBooking.startTime, viewBooking.endTime)}
              </p>
              <p className="font-medium">{viewBooking.userName}</p>
              {viewBooking.description && (
                <p className="text-sm text-muted-foreground">{viewBooking.description}</p>
              )}
              {cancelError && (
                <p className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
                  {cancelError}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewBooking(null)}>
                  {t("close")}
                </Button>
                {(viewBooking.userId === currentUserId || isAdmin) && (
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={handleCancelBooking}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? t("deleting") : t("cancelBooking")}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SlotCell({
  booking,
  currentUserId,
  onFreeClick,
  onBookingClick,
  bookSlotLabel,
}: {
  booking: BookingItem | null;
  currentUserId: string;
  onFreeClick: (() => void) | undefined;
  onBookingClick?: () => void;
  bookSlotLabel: string;
}) {
  const isMine = booking?.userId === currentUserId;

  if (booking) {
    return (
      <div
        className={cn(
          "min-h-[80px] border-b border-dashed border-slate-100 p-1.5",
          onBookingClick && "cursor-pointer"
        )}
        style={{ minHeight: ROW_HEIGHT }}
        onClick={onBookingClick}
        role={onBookingClick ? "button" : undefined}
      >
        <Card
          className={cn(
            "h-full min-h-[76px] border-l-4 shadow-sm transition-shadow hover:shadow",
            isMine
              ? "border-l-indigo-500 border-slate-200 bg-indigo-50/80 dark:border-l-indigo-400 dark:bg-indigo-950/30"
              : "border-l-slate-400 border-slate-200 bg-slate-50 dark:border-l-slate-500 dark:bg-slate-900/30"
          )}
        >
          <CardContent className="flex h-full flex-col justify-center p-3">
            <p className="text-[10px] tabular-nums text-slate-500">
              {formatTimeRange(booking.startTime, booking.endTime)}
            </p>
            <p className="truncate font-semibold leading-tight text-slate-800">{booking.userName}</p>
            {booking.description && (
              <p className="mt-0.5 truncate text-xs text-slate-600">
                {booking.description}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="group relative flex min-h-[80px] w-full cursor-pointer items-center justify-center border-b border-dashed border-slate-100 bg-white transition-colors hover:bg-indigo-50"
      style={{ minHeight: ROW_HEIGHT }}
      onClick={onFreeClick}
    >
      <span className="text-2xl text-indigo-400 opacity-0 transition-opacity group-hover:opacity-100">
        +
      </span>
      <span className="sr-only">{bookSlotLabel}</span>
    </button>
  );
}
