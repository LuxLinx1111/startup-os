"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Plus, Trash2, Video } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Meeting {
  id: string;
  title: string;
  cadence: string | null;
  scheduledAt: string | null;
  notes: string | null;
  actionItems: string | null;
}

function MeetingDialog({
  open,
  onOpenChange,
  meeting,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  meeting?: Meeting | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [actionItems, setActionItems] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setCadence(meeting.cadence ?? "");
      setScheduledAt(meeting.scheduledAt ? meeting.scheduledAt.slice(0, 16) : "");
      setNotes(meeting.notes ?? "");
      setActionItems(meeting.actionItems ?? "");
    } else if (open) {
      setTitle("");
      setCadence("");
      setScheduledAt("");
      setNotes("");
      setActionItems("");
    }
  }, [meeting, open]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title,
      cadence: cadence || null,
      scheduledAt: scheduledAt || null,
      notes: notes || null,
      actionItems: actionItems || null,
    };
    try {
      if (meeting) {
        await fetch(`/api/meetings/${meeting.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/meetings", {
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meeting ? "Edit meeting" : "New meeting"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly founder sync" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cadence</Label>
              <Input value={cadence} onChange={(e) => setCadence(e.target.value)} placeholder="Weekly, Mondays 9am" />
            </div>
            <div className="space-y-1.5">
              <Label>Next scheduled</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <div className="space-y-1.5">
            <Label>Action items</Label>
            <Textarea value={actionItems} onChange={(e) => setActionItems(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save meeting"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MeetingsPage() {
  const { data: meetings, mutate } = useSWR<Meeting[]>("/api/meetings", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  async function remove(id: string) {
    if (!confirm("Delete this meeting?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Meeting Hub"
        description="Agendas, notes, and action items from your founder syncs."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New meeting
          </Button>
        }
      />

      <div className="space-y-3">
        {(meetings ?? []).map((m) => (
          <Card key={m.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Video className="h-4 w-4 text-primary" /> {m.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(m);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => remove(m.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {m.cadence && <p className="text-muted-foreground">Cadence: {m.cadence}</p>}
              {m.scheduledAt && (
                <p className="text-muted-foreground">
                  Next: {format(new Date(m.scheduledAt), "MMM d, yyyy h:mm a")}
                </p>
              )}
              {m.notes && (
                <p>
                  <span className="font-medium">Notes: </span>
                  {m.notes}
                </p>
              )}
              {m.actionItems && (
                <p>
                  <span className="font-medium">Action items: </span>
                  {m.actionItems}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        {(meetings ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No meetings logged yet.</p>
        )}
      </div>

      <MeetingDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        meeting={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
