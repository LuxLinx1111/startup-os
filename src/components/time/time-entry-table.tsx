"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ManualEntryDialog } from "@/components/time/manual-entry-dialog";
import { useTimeEntries, type TimeEntryDTO } from "@/hooks/use-time-entries";

export function TimeEntryTable() {
  const { entries, mutate } = useTimeEntries();
  const [editing, setEditing] = useState<TimeEntryDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm("Delete this time entry?")) return;
    await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Date</th>
            <th className="px-4 py-2 font-medium">Person</th>
            <th className="px-4 py-2 font-medium">Task</th>
            <th className="px-4 py-2 font-medium">Hours</th>
            <th className="px-4 py-2 font-medium">Notes</th>
            <th className="px-4 py-2 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map((e) => (
            <tr key={e.id} className="hover:bg-accent/30">
              <td className="px-4 py-2.5">
                {format(new Date(e.startedAt), "MMM d, yyyy")}
                {e.isRunning && (
                  <Badge variant="success" className="ml-2">
                    Running
                  </Badge>
                )}
              </td>
              <td className="px-4 py-2.5">{e.user.name}</td>
              <td className="px-4 py-2.5 text-muted-foreground">{e.task?.title ?? "—"}</td>
              <td className="px-4 py-2.5 font-medium">{(e.durationMinutes / 60).toFixed(2)}</td>
              <td className="max-w-[200px] truncate px-4 py-2.5 text-muted-foreground">{e.notes ?? "—"}</td>
              <td className="px-4 py-2.5">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEditing(e);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No time entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <ManualEntryDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        entry={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
