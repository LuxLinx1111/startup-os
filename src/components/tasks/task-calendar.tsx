"use client";

import { useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { cn, priorityColors } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/task-include";

export function TaskCalendar({
  tasks,
  onTaskClick,
}: {
  tasks: TaskWithRelations[];
  onTaskClick: (id: string) => void;
}) {
  const [month, setMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, [month]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return map;
  }, [tasks]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-lg font-semibold">{format(month, "MMMM yyyy")}</p>
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
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-muted/50 px-2 py-1.5 text-center font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
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
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => onTaskClick(task.id)}
                    className="flex w-full items-center gap-1 truncate rounded bg-accent px-1 py-0.5 text-left hover:bg-accent/70"
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", priorityColors[task.priority])} />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="px-1 text-[10px] text-muted-foreground">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
