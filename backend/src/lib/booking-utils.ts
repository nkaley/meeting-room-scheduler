import {
  addDays,
  isBefore,
  isAfter,
  startOfDay,
} from "date-fns";

export type ScheduleSettings = {
  workStartHour: number;
  workEndHour: number;
  bookingStepMinutes: number;
  workDays: number[];
  maxBookingDistanceDays: number;
  maxBookingDurationMinutes: number;
  requireDescription: boolean;
  timezone: string;
};

export function getLocalPartsInTimezone(
  utcDate: Date,
  timezone: string
): { hour: number; minute: number; dayOfWeek: number } {
  const tz = timezone?.trim() || "UTC";
  const hourF = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
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
  const localHourAtNoon = parseInt(
    hourF.formatToParts(noonUtc).find((p) => p.type === "hour")?.value ?? "12",
    10
  );
  const offsetHours = localHourAtNoon - 12;
  const dayStart = new Date(Date.UTC(y, m - 1, d, workStartHour - offsetHours, 0, 0, 0));
  const dayEnd = new Date(Date.UTC(y, m - 1, d, workEndHour - offsetHours, 0, 0, 0));
  return { dayStart, dayEnd };
}

export function slotEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60 * 1000);
}

export function intervalsOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): boolean {
  return isBefore(start1, end2) && isAfter(end1, start2);
}

export { addDays, startOfDay };
