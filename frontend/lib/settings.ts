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
