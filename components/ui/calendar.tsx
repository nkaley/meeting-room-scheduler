"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, locale = enUS, ...props }: CalendarProps) {
  return (
    <DayPicker
      locale={locale}
      className={cn("rounded-lg border p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "flex flex-col gap-4",
        month_caption: "flex justify-center items-center gap-2",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        button_previous: "size-9 rounded-md border bg-background hover:bg-accent",
        button_next: "size-9 rounded-md border bg-background hover:bg-accent",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 rounded-md text-center text-xs text-muted-foreground",
        week: "flex w-full mt-1",
        day: "size-9 p-0 text-center text-sm",
        day_button:
          "size-9 rounded-md hover:bg-accent aria-selected:bg-primary aria-selected:text-primary-foreground",
        selected: "bg-primary text-primary-foreground",
        today: "bg-accent",
        outside: "text-muted-foreground opacity-50",
        disabled: "opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
