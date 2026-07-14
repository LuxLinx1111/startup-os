"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BugDialog, type BugDTO } from "@/components/bugs/bug-dialog";
import { bugSeverityColors, bugStatusLabels, cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BugWithTask extends BugDTO {
  task: { id: string; title: string } | null;
}

export default function BugsPage() {
  const { data: bugs, mutate } = useSWR<BugWithTask[]>("/api/bugs", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BugWithTask | null>(null);

  const openCount = (bugs ?? []).filter((b) => b.status === "OPEN").length;

  return (
    <div>
      <PageHeader
        title="Bug Tracker"
        description={`${openCount} open issue${openCount === 1 ? "" : "s"} right now.`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Report bug
          </Button>
        }
      />

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Bug</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Linked task</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(bugs ?? []).map((b) => (
              <tr
                key={b.id}
                className="cursor-pointer hover:bg-accent/30"
                onClick={() => {
                  setEditing(b);
                  setDialogOpen(true);
                }}
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", bugSeverityColors[b.severity])} />
                    <span className="font-medium">{b.title}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.severity}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="secondary">{bugStatusLabels[b.status]}</Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.task?.title ?? "—"}</td>
              </tr>
            ))}
            {(bugs ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No bugs reported. Long may it last.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <BugDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        bug={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
