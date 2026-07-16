"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { useToast } from "@/components/ui/use-toast";
import type { TimeEntryDTO } from "@/hooks/use-time-entries";

interface ManualEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  entry?: TimeEntryDTO | null;
}

export function ManualEntryDialog({ open, onOpenChange, onSaved, entry }: ManualEntryDialogProps) {
  const { tasks } = useTasks();
  const { toast } = useToast();

  const [taskId, setTaskId] = useState("none");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) {
      setTaskId(entry.taskId ?? "none");
      setDate(format(new Date(entry.startedAt), "yyyy-MM-dd"));
      setStartTime(format(new Date(entry.startedAt), "HH:mm"));
      setEndTime(entry.endedAt ? format(new Date(entry.endedAt), "HH:mm") : "");
      setNotes(entry.notes ?? "");
    } else if (open) {
      setTaskId("none");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setStartTime("09:00");
      setEndTime("10:00");
      setNotes("");
    }
  }, [entry, open]);

  async function handleSave() {
    setSaving(true);
    const startedAt = new Date(`${date}T${startTime}`).toISOString();
    const endedAt = endTime ? new Date(`${date}T${endTime}`).toISOString() : null;

    const payload = {
      taskId: taskId === "none" ? null : taskId,
      startedAt,
      endedAt,
      isManual: true,
      isRunning: false,
      notes: notes || null,
    };

    try {
      if (entry) {
        await fetch(`/api/time-entries/${entry.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      toast({ title: entry ? "Entry updated" : "Entry added" });
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{entry ? "Edit time entry" : "Add time entry"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Task (optional)</Label>
            <Select value={taskId} onValueChange={setTaskId}>
              <SelectTrigger>
                <SelectValue />
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
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Start</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
