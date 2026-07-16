"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTasks } from "@/hooks/use-tasks";
import { bugStatusLabels } from "@/lib/utils";

export interface BugDTO {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  stepsToReproduce: string | null;
  resolution: string | null;
  taskId: string | null;
}

export function BugDialog({
  open,
  onOpenChange,
  bug,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bug?: BugDTO | null;
  onSaved: () => void;
}) {
  const { tasks } = useTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("MEDIUM");
  const [status, setStatus] = useState("OPEN");
  const [steps, setSteps] = useState("");
  const [resolution, setResolution] = useState("");
  const [taskId, setTaskId] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bug) {
      setTitle(bug.title);
      setDescription(bug.description ?? "");
      setSeverity(bug.severity);
      setStatus(bug.status);
      setSteps(bug.stepsToReproduce ?? "");
      setResolution(bug.resolution ?? "");
      setTaskId(bug.taskId ?? "none");
    } else if (open) {
      setTitle("");
      setDescription("");
      setSeverity("MEDIUM");
      setStatus("OPEN");
      setSteps("");
      setResolution("");
      setTaskId("none");
    }
  }, [bug, open]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title,
      description: description || null,
      severity,
      status,
      stepsToReproduce: steps || null,
      resolution: resolution || null,
      taskId: taskId === "none" ? null : taskId,
    };
    try {
      if (bug) {
        await fetch(`/api/bugs/${bug.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/bugs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{bug ? "Edit bug" : "Report a bug"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(bugStatusLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Steps to reproduce</Label>
            <Textarea value={steps} onChange={(e) => setSteps(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Linked task (optional)</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Resolution</Label>
            <Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save bug"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
