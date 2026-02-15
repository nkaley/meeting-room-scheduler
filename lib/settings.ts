import { prisma } from "@/lib/prisma";

export type ScheduleSettings = {
  workStartHour: number;
  workEndHour: number;
  bookingStepMinutes: number;
  workDays: number[];
  maxBookingDistanceDays: number;
  maxBookingDurationMinutes: number;
  requireDescription: boolean;
};

const DEFAULTS: ScheduleSettings = {
  workStartHour: 9,
  workEndHour: 18,
  bookingStepMinutes: 30,
  workDays: [1, 2, 3, 4, 5],
  maxBookingDistanceDays: 14,
  maxBookingDurationMinutes: 120,
  requireDescription: false,
};

export async function getOrCreateSettings(): Promise<ScheduleSettings> {
  const row = await getOrCreateSettingsRow();
  return rowToSettings(row);
}

async function getOrCreateSettingsRow() {
  let row = await prisma.systemSettings.findFirst();
  if (!row) {
    row = await prisma.systemSettings.create({
      data: {
        workStartHour: DEFAULTS.workStartHour,
        workEndHour: DEFAULTS.workEndHour,
        bookingStepMinutes: DEFAULTS.bookingStepMinutes,
        workDays: DEFAULTS.workDays,
        maxBookingDistanceDays: DEFAULTS.maxBookingDistanceDays,
        maxBookingDurationMinutes: DEFAULTS.maxBookingDurationMinutes,
        requireDescription: DEFAULTS.requireDescription,
      },
    });
  }
  return row;
}

function rowToSettings(row: {
  workStartHour?: number;
  workEndHour?: number;
  bookingStepMinutes?: number;
  workDays?: number[] | null;
  maxBookingDistanceDays?: number;
  maxBookingDurationMinutes?: number;
  requireDescription?: boolean;
}): ScheduleSettings {
  const workDays = row.workDays && Array.isArray(row.workDays) ? row.workDays : DEFAULTS.workDays;
  return {
    workStartHour: row.workStartHour ?? DEFAULTS.workStartHour,
    workEndHour: row.workEndHour ?? DEFAULTS.workEndHour,
    bookingStepMinutes: row.bookingStepMinutes ?? DEFAULTS.bookingStepMinutes,
    workDays,
    maxBookingDistanceDays: row.maxBookingDistanceDays ?? DEFAULTS.maxBookingDistanceDays,
    maxBookingDurationMinutes: row.maxBookingDurationMinutes ?? DEFAULTS.maxBookingDurationMinutes,
    requireDescription: row.requireDescription ?? DEFAULTS.requireDescription,
  };
}

export type UpdateSettingsInput = ScheduleSettings;

export async function updateSettings(data: UpdateSettingsInput): Promise<{ error?: string }> {
  const row = await getOrCreateSettingsRow();
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
    },
  });
  return {};
}
