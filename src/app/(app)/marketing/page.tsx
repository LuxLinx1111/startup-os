"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface MarketingItem {
  id: string;
  type: string;
  title: string;
  channel: string | null;
  scheduledDate: string | null;
  status: string;
  content: string | null;
}

const typeLabels: Record<string, string> = {
  SOCIAL_POST: "Social Post",
  EMAIL: "Email",
  EVENT: "Event",
  PARTNERSHIP: "Partnership",
  CONTENT: "Content",
};
const statusLabels: Record<string, string> = { IDEA: "Idea", SCHEDULED: "Scheduled", PUBLISHED: "Published" };

function MarketingDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("SOCIAL_POST");
  const [channel, setChannel] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setType("SOCIAL_POST");
      setChannel("");
      setScheduledDate("");
      setContent("");
    }
  }, [open]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          channel: channel || null,
          scheduledDate: scheduledDate || null,
          content: content || null,
          status: scheduledDate ? "SCHEDULED" : "IDEA",
        }),
      });
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
          <DialogTitle>New marketing item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder="Instagram, newsletter..." />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Scheduled date</Label>
            <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Content / notes</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add to plan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MarketingPage() {
  const { data: items, mutate } = useSWR<MarketingItem[]>("/api/marketing", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function remove(id: string) {
    await fetch(`/api/marketing/${id}`, { method: "DELETE" });
    mutate();
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/marketing/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Marketing Planner"
        description="Social posts, email campaigns, launch events, partnerships, and content — all in one calendar of activity."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New item
          </Button>
        }
      />

      <div className="space-y-3">
        {(items ?? []).map((i) => (
          <Card key={i.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-primary" />
                  <span className="font-medium">{i.title}</span>
                  <Badge variant="secondary">{typeLabels[i.type]}</Badge>
                  {i.channel && <Badge variant="outline">{i.channel}</Badge>}
                </div>
                {i.content && <p className="text-sm text-muted-foreground">{i.content}</p>}
                {i.scheduledDate && (
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(i.scheduledDate), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([v, l]) => (
                      <SelectItem key={v} value={v}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" onClick={() => remove(i.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(items ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No marketing items planned yet.</p>
        )}
      </div>

      <MarketingDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => mutate()} />
    </div>
  );
}
