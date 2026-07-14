"use client";

import { useMemo } from "react";
import { addDays, differenceInCalendarDays, format, max, min, startOfDay } from "date-fns";
import { cn, priorityColors } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/task-include";

const DAY_WIDTH = 32;

export function TaskGantt({
  tasks,
  onTaskClick,
}: {
  tasks: TaskWithRelations[];
  onTaskClick: (id: string) => void;
}) {
  const dated = tasks.filter((t) => t.dueDate);

  const { rangeStart, days } = useMemo(() => {
    const today = startOfDay(new Date());
    if (dated.length === 0) {
      return { rangeStart: today, days: eachDayCount(today, addDays(today, 30)) };
    }
    const dueDates = dated.map((t) => startOfDay(new Date(t.dueDate!)));
    const createdDates = dated.map((t) => startOfDay(new Date(t.createdAt)));
    const earliest = min([...createdDates, today]);
    const latest = addDays(max(dueDates), 3);
    return { rangeStart: earliest, days: eachDayCount(earliest, latest) };
  }, [dated]);

  function eachDayCount(start: Date, end: Date) {
    const count = Math.max(differenceInCalendarDays(end, start), 14);
    return Array.from({ length: count + 1 }, (_, i) => addDays(start, i));
  }

  if (dated.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No tasks with due dates yet — add a due date to see it on the timeline.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <div style={{ minWidth: days.length * DAY_WIDTH + 220 }}>
        {/* Header row of dates */}
        <div className="flex border-b bg-muted/40 text-[11px] text-muted-foreground">
          <div className="w-[220px] shrink-0 border-r px-3 py-2 font-medium">Task</div>
          <div className="flex">
            {days.map((d) => (
              <div
                key={d.toISOString()}
                className="flex w-8 shrink-0 flex-col items-center justify-center border-r py-1"
              >
                <span>{format(d, "d")}</span>
                <span className="text-[9px]">{format(d, "EEEEE")}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {dated.map((task) => {
          const due = startOfDay(new Date(task.dueDate!));
          const created = startOfDay(new Date(task.createdAt));
          const barStart = created < rangeStart ? rangeStart : created;
          const offsetDays = Math.max(differenceInCalendarDays(barStart, rangeStart), 0);
          const spanDays = Math.max(differenceInCalendarDays(due, barStart), 1);

          return (
            <div key={task.id} className="flex border-b last:border-b-0">
              <button
                onClick={() => onTaskClick(task.id)}
                className="w-[220px] shrink-0 truncate border-r px-3 py-2.5 text-left text-sm hover:bg-accent/40"
              >
                {task.title}
              </button>
              <div className="relative" style={{ width: days.length * DAY_WIDTH, height: 40 }}>
                <div
                  onClick={() => onTaskClick(task.id)}
                  className={cn(
                    "absolute top-2 h-5 cursor-pointer rounded-full opacity-80 hover:opacity-100",
                    priorityColors[task.priority]
                  )}
                  style={{
                    left: offsetDays * DAY_WIDTH,
                    width: Math.max(spanDays * DAY_WIDTH, DAY_WIDTH),
                  }}
                  title={`${task.title}: due ${format(due, "MMM d, yyyy")}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
