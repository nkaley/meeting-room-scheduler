"use client";

import { useState } from "react";
import { format } from "date-fns";
import { addDays, startOfDay } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toLocalDateString, parseLocalDate } from "@/lib/booking-utils";
import { useLanguage } from "@/contexts/language-context";
import type { ScheduleSettings } from "@/lib/settings";

type DateNavProps = {
  selectedDate: string;
  onDateChange: (dateStr: string) => void;
  settings: ScheduleSettings;
};

export function DateNav({ selectedDate, onDateChange, settings }: DateNavProps) {
  const { t, dateFnsLocale } = useLanguage();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const selectedDay = parseLocalDate(selectedDate);

  const goPrev = () => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() - 1);
    while (!settings.workDays.includes(d.getDay())) d.setDate(d.getDate() - 1);
    onDateChange(toLocalDateString(d));
  };

  const goToday = () => {
    let d = startOfDay(new Date());
    while (!settings.workDays.includes(d.getDay())) d = addDays(d, 1);
    onDateChange(toLocalDateString(d));
  };

  const goNext = () => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + 1);
    while (!settings.workDays.includes(d.getDay())) d.setDate(d.getDate() + 1);
    onDateChange(toLocalDateString(d));
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" onClick={goPrev} className="h-9 w-9 shrink-0" title={t("yesterday")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={goToday} className="shrink-0">
          {t("today")}
        </Button>
        <Button variant="outline" size="icon" onClick={goNext} className="h-9 w-9 shrink-0" title={t("tomorrow")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "min-w-[140px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDay, "d MMMM yyyy", { locale: dateFnsLocale })}
              <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              locale={dateFnsLocale}
              selected={selectedDay}
              onSelect={(date) => {
                if (date) {
                  onDateChange(toLocalDateString(date));
                  setCalendarOpen(false);
                }
              }}
              disabled={(date) => {
                const dayStart = startOfDay(date);
                const today = startOfDay(new Date());
                if (dayStart < today) return true;
                const maxDate = addDays(today, settings.maxBookingDistanceDays);
                if (dayStart > maxDate) return true;
                return !settings.workDays.includes(date.getDay());
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
