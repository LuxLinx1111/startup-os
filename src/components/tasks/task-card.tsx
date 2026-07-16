"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { CalendarDays, CheckSquare, MessageSquare } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials, priorityColors } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/task-include";

export function TaskCard({ task, onClick }: { task: TaskWithRelations; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const doneItems = task.checklist.filter((c) => c.isDone).length;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-pointer space-y-2 p-3 hover:border-primary/50",
        isDragging && "kanban-dragging"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", priorityColors[task.priority])} />
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.tags.map(({ tag }) => (
            <Badge key={tag.id} variant="outline" className="text-[10px] font-normal">
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
          {task.checklist.length > 0 && (
            <span className="flex items-center gap-1">
              <CheckSquare className="h-3 w-3" />
              {doneItems}/{task.checklist.length}
            </span>
          )}
          {task.comments.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {task.comments.length}
            </span>
          )}
        </div>
        {task.owner && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={task.owner.image ?? undefined} />
            <AvatarFallback className="text-[9px]">{initials(task.owner.name)}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </Card>
  );
}
