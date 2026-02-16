"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateSettings as updateSettingsDb } from "@/lib/settings";

export type SettingsFormData = {
  workStartHour: number;
  workEndHour: number;
  timezone: string;
  bookingStepMinutes: number;
  workDays: number[];
  maxBookingDistanceDays: number;
  maxBookingDurationMinutes: number;
  requireDescription: boolean;
};

export async function updateSettings(data: SettingsFormData): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { error: "Forbidden" };
  }
  if (data.workEndHour <= data.workStartHour) {
    return { error: "settingsErrorEndBeforeStart" };
  }
  const res = await updateSettingsDb(data);
  revalidatePath("/");
  revalidatePath("/admin/settings");
  return res;
}
