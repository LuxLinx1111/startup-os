"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/app/api/calendar/route";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const typeColors: Record<CalendarEvent["type"], string> = {
  task: "bg-blue-500",
  milestone: "bg-primary",
  meeting: "bg-emerald-500",
  marketing: "bg-amber-500",
};

const typeLabels: Record<CalendarEvent["type"], string> = {
  task: "Task due",
  milestone: "Milestone",
  meeting: "Meeting",
  marketing: "Marketing",
};

export default function CalendarPage() {
  const { data: events } = useSWR<CalendarEvent[]>("/api/calendar", fetcher);
  const [month, setMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events ?? []) {
      const key = format(new Date(e.date), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [events]);

  return (
    <div>
      <PageHeader
        title="Shared Calendar"
        description="Task due dates, milestones, meetings, and marketing campaigns — one view of everything with a date."
      />

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">{format(month, "MMMM yyyy")}</p>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {Object.entries(typeLabels).map(([type, label]) => (
              <span key={type} className="flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full", typeColors[type as CalendarEvent["type"]])} />
                {label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => setMonth((m) => subMonths(m, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMonth(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => setMonth((m) => addMonths(m, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted/50 px-2 py-1.5 text-center font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn(
                "min-h-[100px] bg-background p-1.5",
                !isSameMonth(day, month) && "bg-muted/20 text-muted-foreground",
                isSameDay(day, new Date()) && "ring-1 ring-inset ring-primary"
              )}
            >
              <p className="mb-1 text-right text-[11px]">{format(day, "d")}</p>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((e) => (
                  <Link
                    key={`${e.type}-${e.id}`}
                    href={e.href}
                    className="flex items-center gap-1 truncate rounded bg-accent px-1 py-0.5 hover:bg-accent/70"
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", typeColors[e.type])} />
                    <span className="truncate">{e.title}</span>
                  </Link>
                ))}
                {dayEvents.length > 3 && (
                  <p className="px-1 text-[10px] text-muted-foreground">+{dayEvents.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
