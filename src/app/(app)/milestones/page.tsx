"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Flag, Plus, Trash2, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { milestoneStatusLabels } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Milestone {
  id: string;
  name: string;
  description: string | null;
  targetDate: string | null;
  status: string;
  risks: string | null;
  dependencies: string | null;
  tasks: { id: string; status: string; title: string }[];
}

function MilestoneDialog({
  open,
  onOpenChange,
  milestone,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  milestone?: Milestone | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [status, setStatus] = useState("NOT_STARTED");
  const [risks, setRisks] = useState("");
  const [dependencies, setDependencies] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (milestone) {
      setName(milestone.name);
      setDescription(milestone.description ?? "");
      setTargetDate(milestone.targetDate ? milestone.targetDate.slice(0, 10) : "");
      setStatus(milestone.status);
      setRisks(milestone.risks ?? "");
      setDependencies(milestone.dependencies ?? "");
    } else if (open) {
      setName("");
      setDescription("");
      setTargetDate("");
      setStatus("NOT_STARTED");
      setRisks("");
      setDependencies("");
    }
  }, [milestone, open]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name,
      description: description || null,
      targetDate: targetDate || null,
      status,
      risks: risks || null,
      dependencies: dependencies || null,
    };
    try {
      if (milestone) {
        await fetch(`/api/milestones/${milestone.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/milestones", {
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
          <DialogTitle>{milestone ? "Edit milestone" : "New milestone"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Public Beta" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(milestoneStatusLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Risks</Label>
            <Textarea value={risks} onChange={(e) => setRisks(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>Dependencies</Label>
            <Textarea value={dependencies} onChange={(e) => setDependencies(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save milestone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function MilestonesPage() {
  const { data: milestones, mutate } = useSWR<Milestone[]>("/api/milestones", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Milestone | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this milestone? Linked tasks will be unlinked, not deleted.")) return;
    await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Milestones"
        description="MVP, beta, app store submission, launch, and beyond — with completion rolled up from linked tasks."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New milestone
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(milestones ?? []).map((m) => {
          const total = m.tasks.length;
          const done = m.tasks.filter((t) => t.status === "DONE").length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <Card key={m.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-primary" /> {m.name}
                </CardTitle>
                <Badge variant="secondary">{milestoneStatusLabels[m.status]}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      {done}/{total} tasks
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
                {m.targetDate && (
                  <p className="text-xs text-muted-foreground">
                    Target: {format(new Date(m.targetDate), "MMM d, yyyy")}
                  </p>
                )}
                {m.risks && <p className="text-xs text-muted-foreground">Risks: {m.risks}</p>}
                <div className="flex justify-between pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(m);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {milestones?.length === 0 && (
          <p className="text-sm text-muted-foreground">No milestones yet — add your first one above.</p>
        )}
      </div>

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        milestone={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
