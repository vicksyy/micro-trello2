"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        caption: "relative flex items-center justify-start pt-1",
        caption_label: "ml-2 text-sm font-medium",
        nav: "absolute right-2 flex items-center gap-1",
        nav_button: "h-7 w-7 rounded-md border border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100",
        month: "space-y-2",
        day_selected:
          "bg-slate-900 text-white hover:bg-slate-900 hover:text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100",
        day_today: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100",
        day_outside:
          "text-slate-400 opacity-50 dark:text-slate-500 aria-selected:bg-slate-100/50 dark:aria-selected:bg-slate-800/50",
        day_disabled: "text-slate-300 opacity-50 dark:text-slate-600",
        day_range_middle:
          "aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-100",
        ...classNames,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
