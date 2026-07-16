"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ChevronUp, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn, priorityColors } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  targetVersion: string | null;
  status: string;
  requestedBy: string | null;
  votes: number;
}

const statusLabels: Record<string, string> = {
  IDEA: "Idea",
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  SHIPPED: "Shipped",
};
const statuses = Object.keys(statusLabels);

function RoadmapDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [targetVersion, setTargetVersion] = useState("");
  const [requestedBy, setRequestedBy] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setTargetVersion("");
      setRequestedBy("");
    }
  }, [open]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          priority,
          targetVersion: targetVersion || null,
          requestedBy: requestedBy || null,
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
          <DialogTitle>New roadmap item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
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
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target version</Label>
              <Input value={targetVersion} onChange={(e) => setTargetVersion(e.target.value)} placeholder="v1.1" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Requested by (optional)</Label>
            <Input value={requestedBy} onChange={(e) => setRequestedBy(e.target.value)} placeholder="Customer name" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add to roadmap"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoadmapPage() {
  const { data: items, mutate } = useSWR<RoadmapItem[]>("/api/roadmap", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, RoadmapItem[]>();
    for (const s of statuses) map.set(s, []);
    for (const i of items ?? []) map.get(i.status)?.push(i);
    return map;
  }, [items]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/roadmap/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  async function upvote(item: RoadmapItem) {
    await fetch(`/api/roadmap/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votes: item.votes + 1 }),
    });
    mutate();
  }

  async function remove(id: string) {
    await fetch(`/api/roadmap/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Feature Roadmap"
        description="Future features, priorities, target versions, and customer requests."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New item
          </Button>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {statuses.map((status) => (
          <div key={status} className="rounded-lg border bg-muted/30 p-2">
            <p className="mb-2 px-1 text-sm font-semibold">
              {statusLabels[status]} <span className="text-muted-foreground">({grouped.get(status)?.length ?? 0})</span>
            </p>
            <div className="space-y-2">
              {(grouped.get(status) ?? []).map((item) => (
                <Card key={item.id}>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", priorityColors[item.priority])} />
                    </div>
                    {item.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {item.targetVersion && <Badge variant="outline">{item.targetVersion}</Badge>}
                      {item.requestedBy && <Badge variant="outline">from {item.requestedBy}</Badge>}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => upvote(item)}>
                        <ChevronUp className="mr-1 h-3.5 w-3.5" /> {item.votes}
                      </Button>
                      <Select value={item.status} onValueChange={(v) => updateStatus(item.id, v)}>
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabels[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <RoadmapDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => mutate()} />
    </div>
  );
}
