"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "@/components/tasks/task-card";
import { statusColumns, statusLabels, cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/task-include";

function Column({
  status,
  tasks,
  onCardClick,
}: {
  status: string;
  tasks: TaskWithRelations[];
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 p-2",
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-sm font-semibold">{statusLabels[status]}</p>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onCardClick(task.id)} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

export function TaskBoard({
  tasks,
  onCardClick,
  onMove,
}: {
  tasks: TaskWithRelations[];
  onCardClick: (id: string) => void;
  onMove: (taskId: string, newStatus: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const columns = useMemo(() => {
    const map: Record<string, TaskWithRelations[]> = {};
    for (const s of statusColumns) map[s] = [];
    for (const t of tasks) map[t.status]?.push(t);
    return map;
  }, [tasks]);

  const activeTask = tasks.find((t) => t.id === activeId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Dropped over a column (empty area) or over another card — resolve target status either way.
    const overIsColumn = statusColumns.includes(over.id as (typeof statusColumns)[number]);
    const overTask = tasks.find((t) => t.id === over.id);
    const newStatus = overIsColumn ? (over.id as string) : overTask?.status;

    if (newStatus && newStatus !== activeTask.status) {
      onMove(activeTask.id, newStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {statusColumns.map((status) => (
          <Column key={status} status={status} tasks={columns[status]} onCardClick={onCardClick} />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
