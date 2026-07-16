"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
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
import { useUsers } from "@/hooks/use-tasks";
import { impactColors } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Risk {
  id: string;
  title: string;
  description: string | null;
  impact: string;
  likelihood: string;
  mitigationPlan: string | null;
  status: string;
  owner: { name: string } | null;
  ownerId: string | null;
}

const statusLabels: Record<string, string> = { OPEN: "Open", MITIGATING: "Mitigating", CLOSED: "Closed" };

function RiskDialog({
  open,
  onOpenChange,
  risk,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  risk?: Risk | null;
  onSaved: () => void;
}) {
  const { users } = useUsers();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("MEDIUM");
  const [likelihood, setLikelihood] = useState("MEDIUM");
  const [mitigationPlan, setMitigationPlan] = useState("");
  const [ownerId, setOwnerId] = useState("none");
  const [status, setStatus] = useState("OPEN");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (risk) {
      setTitle(risk.title);
      setDescription(risk.description ?? "");
      setImpact(risk.impact);
      setLikelihood(risk.likelihood);
      setMitigationPlan(risk.mitigationPlan ?? "");
      setOwnerId(risk.ownerId ?? "none");
      setStatus(risk.status);
    } else if (open) {
      setTitle("");
      setDescription("");
      setImpact("MEDIUM");
      setLikelihood("MEDIUM");
      setMitigationPlan("");
      setOwnerId("none");
      setStatus("OPEN");
    }
  }, [risk, open]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title,
      description: description || null,
      impact,
      likelihood,
      mitigationPlan: mitigationPlan || null,
      ownerId: ownerId === "none" ? null : ownerId,
      status,
    };
    try {
      if (risk) {
        await fetch(`/api/risks/${risk.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/risks", {
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
          <DialogTitle>{risk ? "Edit risk" : "Log a risk"}</DialogTitle>
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
              <Label>Impact</Label>
              <Select value={impact} onValueChange={setImpact}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Likelihood</Label>
              <Select value={likelihood} onValueChange={setLikelihood}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH"].map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Mitigation plan</Label>
            <Textarea value={mitigationPlan} onChange={(e) => setMitigationPlan(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={ownerId} onValueChange={setOwnerId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
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
                  {Object.entries(statusLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save risk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RisksPage() {
  const { data: risks, mutate } = useSWR<Risk[]>("/api/risks", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Risk | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this risk?")) return;
    await fetch(`/api/risks/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Risk Register"
        description="What could go wrong, how bad it'd be, and who's watching it."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Log risk
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {(risks ?? []).map((r) => (
          <Card key={r.id}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-primary" /> {r.title}
              </CardTitle>
              <Badge variant="secondary">{statusLabels[r.status]}</Badge>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {r.description && <p className="text-muted-foreground">{r.description}</p>}
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${impactColors[r.impact]}`} /> Impact: {r.impact}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${impactColors[r.likelihood]}`} /> Likelihood:{" "}
                  {r.likelihood}
                </span>
              </div>
              {r.mitigationPlan && (
                <p>
                  <span className="font-medium">Mitigation: </span>
                  <span className="text-muted-foreground">{r.mitigationPlan}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">Owner: {r.owner?.name ?? "Unassigned"}</p>
              <div className="flex justify-between pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(r);
                    setDialogOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(risks ?? []).length === 0 && <p className="text-sm text-muted-foreground">No risks logged yet.</p>}
      </div>

      <RiskDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        risk={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
