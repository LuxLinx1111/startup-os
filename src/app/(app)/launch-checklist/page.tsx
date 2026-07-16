"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { checklistSectionLabels, checklistSections } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChecklistItem {
  id: string;
  section: string;
  title: string;
  isComplete: boolean;
}

export default function LaunchChecklistPage() {
  const { data: items, mutate } = useSWR<ChecklistItem[]>("/api/launch-checklist", fetcher);
  const [newItemText, setNewItemText] = useState<Record<string, string>>({});
  const [seeding, setSeeding] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, ChecklistItem[]>();
    for (const section of checklistSections) map.set(section, []);
    for (const item of items ?? []) map.get(item.section)?.push(item);
    return map;
  }, [items]);

  const totalDone = (items ?? []).filter((i) => i.isComplete).length;
  const total = (items ?? []).length;
  const overallPct = total > 0 ? Math.round((totalDone / total) * 100) : 0;

  async function seedDefaults() {
    setSeeding(true);
    try {
      await fetch("/api/launch-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seedDefaults: true }),
      });
      mutate();
    } finally {
      setSeeding(false);
    }
  }

  async function toggle(item: ChecklistItem) {
    await fetch(`/api/launch-checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isComplete: !item.isComplete }),
    });
    mutate();
  }

  async function addItem(section: string) {
    const title = newItemText[section]?.trim();
    if (!title) return;
    await fetch("/api/launch-checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section, title }),
    });
    setNewItemText((s) => ({ ...s, [section]: "" }));
    mutate();
  }

  async function remove(id: string) {
    await fetch(`/api/launch-checklist/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Launch Checklist"
        description="Everything to check before you hit submit — dev, QA, legal, marketing, app stores, analytics, support, and post-launch."
        actions={
          total === 0 ? (
            <Button onClick={seedDefaults} disabled={seeding}>
              <Sparkles className="mr-1.5 h-4 w-4" /> {seeding ? "Adding..." : "Add standard checklist"}
            </Button>
          ) : undefined
        }
      />

      {total > 0 && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-sm">
            <span>
              {totalDone}/{total} complete
            </span>
            <span className="font-medium">{overallPct}%</span>
          </div>
          <Progress value={overallPct} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {checklistSections.map((section) => {
          const sectionItems = grouped.get(section) ?? [];
          return (
            <Card key={section}>
              <CardHeader>
                <CardTitle>{checklistSectionLabels[section]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sectionItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox checked={item.isComplete} onCheckedChange={() => toggle(item)} />
                    <span className={item.isComplete ? "flex-1 text-sm line-through text-muted-foreground" : "flex-1 text-sm"}>
                      {item.title}
                    </span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {sectionItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">No items yet.</p>
                )}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={newItemText[section] ?? ""}
                    onChange={(e) => setNewItemText((s) => ({ ...s, [section]: e.target.value }))}
                    placeholder="Add an item"
                    onKeyDown={(e) => e.key === "Enter" && addItem(section)}
                  />
                  <Button variant="outline" size="icon" onClick={() => addItem(section)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
