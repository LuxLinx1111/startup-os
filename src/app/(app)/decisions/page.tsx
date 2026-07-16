"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Plus, ScrollText, Trash2 } from "lucide-react";
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Decision {
  id: string;
  title: string;
  context: string | null;
  decision: string;
  rationale: string | null;
  outcome: string | null;
  status: string;
  decidedAt: string;
  decidedBy: { name: string };
}

const statusLabels: Record<string, string> = {
  PROPOSED: "Proposed",
  DECIDED: "Decided",
  REVISITED: "Revisited",
};

function DecisionDialog({
  open,
  onOpenChange,
  decision,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  decision?: Decision | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [decisionText, setDecisionText] = useState("");
  const [rationale, setRationale] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState("DECIDED");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (decision) {
      setTitle(decision.title);
      setContext(decision.context ?? "");
      setDecisionText(decision.decision);
      setRationale(decision.rationale ?? "");
      setOutcome(decision.outcome ?? "");
      setStatus(decision.status);
    } else if (open) {
      setTitle("");
      setContext("");
      setDecisionText("");
      setRationale("");
      setOutcome("");
      setStatus("DECIDED");
    }
  }, [decision, open]);

  async function handleSave() {
    if (!title.trim() || !decisionText.trim()) return;
    setSaving(true);
    const payload = {
      title,
      context: context || null,
      decision: decisionText,
      rationale: rationale || null,
      outcome: outcome || null,
      status,
    };
    try {
      if (decision) {
        await fetch(`/api/decisions/${decision.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/decisions", {
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
          <DialogTitle>{decision ? "Edit decision" : "Log a decision"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Choosing React Native over Flutter" />
          </div>
          <div className="space-y-1.5">
            <Label>Context</Label>
            <Textarea value={context} onChange={(e) => setContext(e.target.value)} rows={2} placeholder="What led to this decision?" />
          </div>
          <div className="space-y-1.5">
            <Label>Decision</Label>
            <Textarea value={decisionText} onChange={(e) => setDecisionText(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Rationale</Label>
            <Textarea value={rationale} onChange={(e) => setRationale(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Outcome (fill in later)</Label>
            <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
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
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save decision"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DecisionsPage() {
  const { data: decisions, mutate } = useSWR<Decision[]>("/api/decisions", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this decision record?")) return;
    await fetch(`/api/decisions/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Decision Log"
        description="Why things are the way they are — context, decision, rationale, and outcome."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Log decision
          </Button>
        }
      />

      <div className="space-y-3">
        {(decisions ?? []).map((d) => (
          <Card key={d.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <ScrollText className="h-4 w-4 text-primary" /> {d.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{statusLabels[d.status]}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(d);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {d.context && (
                <p>
                  <span className="font-medium">Context: </span>
                  <span className="text-muted-foreground">{d.context}</span>
                </p>
              )}
              <p>
                <span className="font-medium">Decision: </span>
                {d.decision}
              </p>
              {d.rationale && (
                <p>
                  <span className="font-medium">Rationale: </span>
                  <span className="text-muted-foreground">{d.rationale}</span>
                </p>
              )}
              {d.outcome && (
                <p>
                  <span className="font-medium">Outcome: </span>
                  <span className="text-muted-foreground">{d.outcome}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {d.decidedBy.name} · {format(new Date(d.decidedAt), "MMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
        ))}
        {(decisions ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No decisions logged yet.</p>
        )}
      </div>

      <DecisionDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        decision={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
