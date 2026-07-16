"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials, priorityColors, statusLabels } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/task-include";

export function TaskList({
  tasks,
  onRowClick,
}: {
  tasks: TaskWithRelations[];
  onRowClick: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Task</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 font-medium">Priority</th>
            <th className="px-4 py-2 font-medium">Owner</th>
            <th className="px-4 py-2 font-medium">Due</th>
            <th className="px-4 py-2 font-medium">Est. hrs</th>
            <th className="px-4 py-2 font-medium">Actual hrs</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {tasks.map((task) => {
            const actualMinutes = task.timeEntries.reduce((sum, e) => sum + e.durationMinutes, 0);
            return (
              <tr
                key={task.id}
                onClick={() => onRowClick(task.id)}
                className="cursor-pointer hover:bg-accent/50"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", priorityColors[task.priority])} />
                    <span className="font-medium">{task.title}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">{statusLabels[task.status]}</Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{task.priority}</td>
                <td className="px-4 py-2.5">
                  {task.owner ? (
                    <div className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={task.owner.image ?? undefined} />
                        <AvatarFallback className="text-[9px]">{initials(task.owner.name)}</AvatarFallback>
                      </Avatar>
                      <span>{task.owner.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {task.dueDate ? (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {format(new Date(task.dueDate), "MMM d, yyyy")}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {task.estimatedHours ? Number(task.estimatedHours).toFixed(1) : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{(actualMinutes / 60).toFixed(1)}</td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                No tasks yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
