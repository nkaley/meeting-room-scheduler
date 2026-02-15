"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSettings } from "@/app/actions/settings";
import { useLanguage } from "@/contexts/language-context";
import type { ScheduleSettings } from "@/lib/settings";

const STEP_OPTIONS = [15, 30, 60] as const;
const DAY_KEYS = ["daySun", "dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat"] as const;

const schema = z.object({
  workStartHour: z.coerce.number().min(0).max(23),
  workEndHour: z.coerce.number().min(0).max(23),
  bookingStepMinutes: z.enum(["15", "30", "60"]),
  workDays: z.array(z.number().min(0).max(6)),
  maxBookingDistanceDays: z.coerce.number().min(1).max(365),
  maxBookingDurationMinutes: z.coerce.number().min(15).max(480),
  requireDescription: z.boolean(),
}).refine((data) => data.workEndHour > data.workStartHour, {
  message: "settingsErrorEndBeforeStart",
  path: ["workEndHour"],
});

type FormValues = z.infer<typeof schema>;

function settingsToForm(s: ScheduleSettings): FormValues {
  const step = STEP_OPTIONS.includes(s.bookingStepMinutes as 15 | 30 | 60)
    ? s.bookingStepMinutes
    : 30;
  return {
    workStartHour: s.workStartHour,
    workEndHour: s.workEndHour,
    bookingStepMinutes: String(step) as "15" | "30" | "60",
    workDays: [...s.workDays],
    maxBookingDistanceDays: s.maxBookingDistanceDays,
    maxBookingDurationMinutes: s.maxBookingDurationMinutes ?? 120,
    requireDescription: s.requireDescription,
  };
}

function formToSettings(v: FormValues): ScheduleSettings {
  return {
    workStartHour: v.workStartHour,
    workEndHour: v.workEndHour,
    bookingStepMinutes: Number(v.bookingStepMinutes),
    workDays: v.workDays,
    maxBookingDistanceDays: v.maxBookingDistanceDays,
    maxBookingDurationMinutes: v.maxBookingDurationMinutes,
    requireDescription: v.requireDescription,
  };
}

export function SettingsForm({ initialSettings }: { initialSettings: ScheduleSettings }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: settingsToForm(initialSettings),
  });

  useEffect(() => {
    form.reset(settingsToForm(initialSettings));
  }, [initialSettings, form]);

  const onSubmit = async (values: FormValues) => {
    setSuccess(false);
    const res = await updateSettings(formToSettings(values));
    if (res.error) {
      const message = res.error === "settingsErrorEndBeforeStart" ? t("settingsErrorEndBeforeStart") : res.error;
      form.setError("workEndHour", { message });
      return;
    }
    setSuccess(true);
    router.refresh();
  };

  const workDays = form.watch("workDays");

  const toggleDay = (day: number) => {
    const next = workDays.includes(day)
      ? workDays.filter((d) => d !== day)
      : [...workDays, day].sort((a, b) => a - b);
    form.setValue("workDays", next);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-md space-y-6">
      {success && (
        <p className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
          {t("settingsSaved")}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="workStartHour">{t("workStartHour")}</Label>
          <Input
            id="workStartHour"
            type="number"
            min={0}
            max={23}
            {...form.register("workStartHour", { valueAsNumber: true })}
          />
          {form.formState.errors.workStartHour && (
            <p className="text-sm text-destructive">{form.formState.errors.workStartHour.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="workEndHour">{t("workEndHour")}</Label>
          <Input
            id="workEndHour"
            type="number"
            min={0}
            max={23}
            {...form.register("workEndHour", { valueAsNumber: true })}
          />
          {form.formState.errors.workEndHour && (
            <p className="text-sm text-destructive">
              {form.formState.errors.workEndHour.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("bookingStepMinutes")}</Label>
        <Select
          value={String(form.watch("bookingStepMinutes"))}
          onValueChange={(v) => form.setValue("bookingStepMinutes", v as "15" | "30" | "60")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STEP_OPTIONS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m === 60 ? `1 ${t("durationHour")}` : `${m} ${t("durationMin")}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("workDays")}</Label>
        <div className="flex flex-wrap gap-3">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <label key={day} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={workDays.includes(day)}
                onChange={() => toggleDay(day)}
                className="h-4 w-4 rounded border-input"
              />
              <span>{t(DAY_KEYS[day])}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxBookingDistanceDays">{t("maxBookingDistanceDays")}</Label>
        <Input
          id="maxBookingDistanceDays"
          type="number"
          min={1}
          max={365}
          {...form.register("maxBookingDistanceDays", { valueAsNumber: true })}
        />
        {form.formState.errors.maxBookingDistanceDays && (
          <p className="text-sm text-destructive">
            {form.formState.errors.maxBookingDistanceDays.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxBookingDurationMinutes">{t("maxBookingDurationMinutes")}</Label>
        <Input
          id="maxBookingDurationMinutes"
          type="number"
          min={15}
          max={480}
          {...form.register("maxBookingDurationMinutes", { valueAsNumber: true })}
        />
        {form.formState.errors.maxBookingDurationMinutes && (
          <p className="text-sm text-destructive">
            {form.formState.errors.maxBookingDurationMinutes.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="requireDescription"
          className="h-4 w-4 rounded border-input"
          {...form.register("requireDescription")}
        />
        <Label htmlFor="requireDescription" className="cursor-pointer font-normal">
          {t("requireDescription")}
        </Label>
      </div>

      <Button type="submit">{t("save")}</Button>
    </form>
  );
}
