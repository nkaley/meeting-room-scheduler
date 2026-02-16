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

export function getLocalPartsInTimezone(utcDate: Date, timezone: string): { hour: number; minute: number; dayOfWeek: number } {
  const tz = timezone?.trim() || "UTC";
  const hourF = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", minute: "numeric", hour12: false });
  const weekdayF = new Intl.DateTimeFormat("en-CA", { timeZone: tz, weekday: "short" });
  const hourParts = hourF.formatToParts(utcDate);
  const hour = parseInt(hourParts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(hourParts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const short = weekdayF.format(utcDate);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = dayMap[short] ?? 0;
  return { hour, minute, dayOfWeek };
}

export function getDayBoundsInTimezone(
  dateStr: string,
  timezone: string,
  workStartHour: number,
  workEndHour: number
): { dayStart: Date; dayEnd: Date } {
  const tz = timezone?.trim() || "UTC";
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) {
    const fallback = new Date(dateStr);
    const dayStart = new Date(fallback);
    dayStart.setUTCHours(workStartHour, 0, 0, 0);
    const dayEnd = new Date(fallback);
    dayEnd.setUTCHours(workEndHour, 0, 0, 0);
    return { dayStart, dayEnd };
  }
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));
  const hourF = new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", hour12: false });
  const localHourAtNoon = parseInt(hourF.formatToParts(noonUtc).find((p) => p.type === "hour")?.value ?? "12", 10);
  const offsetHours = localHourAtNoon - 12;
  const dayStart = new Date(Date.UTC(y, m - 1, d, workStartHour - offsetHours, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m - 1, d, workEndHour - offsetHours, 0, 0, 0));
  return { dayStart, dayEnd };
}

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

export function isWeekend(date: Date): boolean {
  const d = date.getDay();
  return d === 0 || d === 6;
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

export function slotEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
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

export function formatDayLabel(date: Date): string {
  return format(date, "EEEE, d MMMM", { locale: enUS });
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
