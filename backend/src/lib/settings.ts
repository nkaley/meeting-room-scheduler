import { prisma } from "./prisma.js";

const DEFAULTS = {
  workStartHour: 9,
  workEndHour: 18,
  bookingStepMinutes: 30,
  workDays: [1, 2, 3, 4, 5],
  maxBookingDistanceDays: 14,
  maxBookingDurationMinutes: 120,
  requireDescription: false,
  timezone: "UTC",
};

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

export async function getOrCreateSettings(): Promise<ScheduleSettings> {
  let row = await prisma.systemSettings.findFirst();
  if (!row) {
    row = await prisma.systemSettings.create({
      data: DEFAULTS,
    });
  }
  const workDays =
    row.workDays && Array.isArray(row.workDays) ? row.workDays : DEFAULTS.workDays;
  return {
    workStartHour: row.workStartHour ?? DEFAULTS.workStartHour,
    workEndHour: row.workEndHour ?? DEFAULTS.workEndHour,
    bookingStepMinutes: row.bookingStepMinutes ?? DEFAULTS.bookingStepMinutes,
    workDays,
    maxBookingDistanceDays: row.maxBookingDistanceDays ?? DEFAULTS.maxBookingDistanceDays,
    maxBookingDurationMinutes: row.maxBookingDurationMinutes ?? DEFAULTS.maxBookingDurationMinutes,
    requireDescription: row.requireDescription ?? DEFAULTS.requireDescription,
    timezone: row.timezone?.trim() || DEFAULTS.timezone,
  };
}

export type UpdateSettingsInput = ScheduleSettings;

export async function updateSettings(data: UpdateSettingsInput): Promise<{ error?: string }> {
  let row = await prisma.systemSettings.findFirst();
  if (!row) {
    row = await prisma.systemSettings.create({ data: DEFAULTS });
  }
  await prisma.systemSettings.update({
    where: { id: row.id },
    data: {
      workStartHour: data.workStartHour,
      workEndHour: data.workEndHour,
      bookingStepMinutes: data.bookingStepMinutes,
      workDays: data.workDays,
      maxBookingDistanceDays: data.maxBookingDistanceDays,
      maxBookingDurationMinutes: data.maxBookingDurationMinutes,
      requireDescription: data.requireDescription,
      timezone: data.timezone,
    },
  });
  return {};
}
