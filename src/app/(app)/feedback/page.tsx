"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Plus } from "lucide-react";
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

interface FeedbackItem {
  id: string;
  source: string | null;
  customerName: string | null;
  content: string;
  type: string;
  status: string;
  createdAt: string;
  linkedRoadmapItem: { id: string; title: string } | null;
  linkedBug: { id: string; title: string } | null;
}

const typeLabels: Record<string, string> = {
  BUG: "Bug",
  FEATURE_REQUEST: "Feature Request",
  PRAISE: "Praise",
  COMPLAINT: "Complaint",
};
const statusLabels: Record<string, string> = {
  NEW: "New",
  TRIAGED: "Triaged",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  ARCHIVED: "Archived",
};

function FeedbackDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [source, setSource] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("FEATURE_REQUEST");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSource("");
      setCustomerName("");
      setContent("");
      setType("FEATURE_REQUEST");
    }
  }, [open]);

  async function handleSave() {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: source || null,
          customerName: customerName || null,
          content,
          type,
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
          <DialogTitle>Log feedback</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Customer name</Label>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="App Store review, email..." />
            </div>
          </div>
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
            <Label>Feedback</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FeedbackPage() {
  const { data: items, mutate } = useSWR<FeedbackItem[]>("/api/feedback", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Customer Feedback"
        description="Everything customers tell you, organized in one place."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Log feedback
          </Button>
        }
      />

      <div className="space-y-3">
        {(items ?? []).map((i) => (
          <Card key={i.id}>
            <CardContent className="flex items-start justify-between gap-4 p-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{typeLabels[i.type]}</Badge>
                  {i.customerName && <span className="text-sm font-medium">{i.customerName}</span>}
                  {i.source && <span className="text-xs text-muted-foreground">via {i.source}</span>}
                </div>
                <p className="text-sm">{i.content}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(i.createdAt), "MMM d, yyyy")}</p>
              </div>
              <Select value={i.status} onValueChange={(v) => updateStatus(i.id, v)}>
                <SelectTrigger className="w-36 shrink-0">
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
            </CardContent>
          </Card>
        ))}
        {(items ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No feedback logged yet.</p>
        )}
      </div>

      <FeedbackDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => mutate()} />
    </div>
  );
}
