"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Project {
  id: string;
  name: string;
  targetLaunchDate: string | null;
  budgetTotal: string | null;
}

export default function SettingsPage() {
  const { data: project, mutate } = useSWR<Project>("/api/project", fetcher);
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [launchDate, setLaunchDate] = useState("");
  const [budget, setBudget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setLaunchDate(project.targetLaunchDate ? project.targetLaunchDate.slice(0, 10) : "");
      setBudget(project.budgetTotal ? String(project.budgetTotal) : "");
    }
  }, [project]);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/project", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetLaunchDate: launchDate || null,
          budgetTotal: budget ? Number(budget) : null,
        }),
      });
      await mutate();
      toast({ title: "Settings saved" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" description="Project-level settings that power the dashboard." />
      <Card>
        <CardHeader>
          <CardTitle>Company & launch</CardTitle>
          <CardDescription>
            Set your target launch date and total budget once — the dashboard's countdown and budget gauge
            read from here automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Project / company name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Target launch date</Label>
            <Input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Total budget (USD)</Label>
            <Input
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 15000"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
