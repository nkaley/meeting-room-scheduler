import {
  addDays,
  setHours,
  setMinutes,
  isBefore,
  isAfter,
  format,
  startOfDay,
} from "date-fns";
import { enUS } from "date-fns/locale";
import type { ScheduleSettings } from "@/lib/settings";

export type SlotStart = Date;

export function getSlotsForDay(day: Date, settings: ScheduleSettings): SlotStart[] {
  const slots: SlotStart[] = [];
  const { workStartHour, workEndHour, bookingStepMinutes } = settings;
  const base = startOfDay(day);
  for (let h = workStartHour; h < workEndHour; h++) {
    for (let m = 0; m < 60; m += bookingStepMinutes) {
      slots.push(setMinutes(setHours(new Date(base), h), m));
    }
  }
  return slots;
}

export function isWorkDay(date: Date, settings: ScheduleSettings): boolean {
  const days = settings?.workDays;
  if (!days || !Array.isArray(days)) return false;
  return days.includes(date.getDay());
}

export function getSelectableDays(settings: ScheduleSettings): Date[] {
  const days: Date[] = [];
  let d = startOfDay(new Date());
  const maxDate = addDays(d, settings.maxBookingDistanceDays);
  while (d <= maxDate) {
    if (isWorkDay(d, settings)) {
      days.push(new Date(d));
    }
    d = addDays(d, 1);
  }
  return days;
}

export function getDurationOptions(settings: ScheduleSettings): { minutes: number }[] {
  const step = settings.bookingStepMinutes;
  const maxMinutes = settings.maxBookingDurationMinutes ?? 120;
  const options: { minutes: number }[] = [];
  for (let m = step; m <= maxMinutes; m += step) {
    options.push({ minutes: m });
  }
  return options;
}

export const DURATION_OPTIONS = [
  { label: "30 min", minutes: 30 },
  { label: "1 h", minutes: 60 },
  { label: "1.5 h", minutes: 90 },
  { label: "2 h", minutes: 120 },
] as const;

export function formatSlotTime(date: Date): string {
  return format(date, "HH:mm", { locale: enUS });
}

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function intervalsOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2);
}
