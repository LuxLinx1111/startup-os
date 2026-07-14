"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskList } from "@/components/tasks/task-list";
import { TaskCalendar } from "@/components/tasks/task-calendar";
import { TaskGantt } from "@/components/tasks/task-gantt";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { useTasks, useUsers } from "@/hooks/use-tasks";

function TasksPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, mutate } = useTasks();
  const { users } = useUsers();

  const [view, setView] = useState("kanban");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  useEffect(() => {
    const qTaskId = searchParams.get("taskId");
    const isNew = searchParams.get("new");
    if (isNew) setOpenTaskId("new");
    else if (qTaskId) setOpenTaskId(qTaskId);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (ownerFilter !== "all" && t.ownerId !== ownerFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [tasks, ownerFilter, priorityFilter, search]);

  async function handleMove(taskId: string, newStatus: string) {
    // optimistic update
    mutate(
      (current) => current?.map((t) => (t.id === taskId ? { ...t, status: newStatus as never } : t)),
      { revalidate: false }
    );
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    mutate();
  }

  function closeDialog(open: boolean) {
    if (!open) {
      setOpenTaskId(null);
      router.replace("/tasks");
    }
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Kanban, list, calendar, and timeline — one source of truth for what needs to happen."
        actions={
          <Button onClick={() => setOpenTaskId("new")}>
            <Plus className="mr-1.5 h-4 w-4" /> New Task
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="gantt">Timeline</TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />

        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Owner" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All owners</SelectItem>
            {users.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view === "kanban" && (
        <TaskBoard tasks={filtered} onCardClick={setOpenTaskId} onMove={handleMove} />
      )}
      {view === "list" && <TaskList tasks={filtered} onRowClick={setOpenTaskId} />}
      {view === "calendar" && <TaskCalendar tasks={filtered} onTaskClick={setOpenTaskId} />}
      {view === "gantt" && <TaskGantt tasks={filtered} onTaskClick={setOpenTaskId} />}

      <TaskDetailDialog
        taskId={openTaskId}
        open={openTaskId !== null}
        onOpenChange={closeDialog}
        onChanged={() => mutate()}
      />
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageInner />
    </Suspense>
  );
}
