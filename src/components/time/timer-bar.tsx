"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useTasks } from "@/hooks/use-tasks";
import { useToast } from "@/components/ui/use-toast";

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TimerBar({ autoStart }: { autoStart?: boolean }) {
  const { data: session } = useSession();
  const { entries, mutate } = useTimeEntries();
  const { tasks } = useTasks();
  const { toast } = useToast();

  const runningEntry = entries.find((e) => e.isRunning && e.userId === session?.user?.id);

  const [taskId, setTaskId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const [now, setNow] = useState(Date.now());
  const [starting, setStarting] = useState(false);
  const hasAutoStarted = useRef(false);

  useEffect(() => {
    if (!runningEntry) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [runningEntry]);

  useEffect(() => {
    if (autoStart && !runningEntry && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      handleStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, runningEntry]);

  async function handleStart() {
    setStarting(true);
    try {
      await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: taskId === "none" ? null : taskId,
          startedAt: new Date().toISOString(),
          isRunning: true,
          isManual: false,
          notes: notes || null,
        }),
      });
      mutate();
      toast({ title: "Timer started" });
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    if (!runningEntry) return;
    await fetch(`/api/time-entries/${runningEntry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endedAt: new Date().toISOString(),
        isRunning: false,
      }),
    });
    mutate();
    setNotes("");
    toast({ title: "Timer stopped and logged" });
  }

  const elapsed = runningEntry ? now - new Date(runningEntry.startedAt).getTime() : 0;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-4">
      <div className="flex h-16 w-40 items-center justify-center rounded-md bg-muted font-mono text-2xl tabular-nums">
        {formatElapsed(elapsed)}
      </div>

      {!runningEntry ? (
        <>
          <Select value={taskId} onValueChange={setTaskId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Attach to a task (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No task</SelectItem>
              {tasks.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="w-48"
            placeholder="What are you working on?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button onClick={handleStart} disabled={starting}>
            <Play className="mr-1.5 h-4 w-4" /> Start
          </Button>
        </>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {runningEntry.task ? `Tracking: ${runningEntry.task.title}` : "Tracking unassigned time"}
            {runningEntry.notes ? ` — ${runningEntry.notes}` : ""}
          </div>
          <Button onClick={handleStop} variant="destructive" className="ml-auto">
            <Square className="mr-1.5 h-4 w-4" /> Stop
          </Button>
        </>
      )}
    </div>
  );
}
