"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Pin, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { NoteDialog, type NoteDTO } from "@/components/notes/note-dialog";
import { noteTypeLabels } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NoteWithMeta extends NoteDTO {
  updatedAt: string;
  author: { name: string };
}

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const { data: notes, mutate } = useSWR<NoteWithMeta[]>(
    `/api/notes${search.length >= 2 ? `?q=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<NoteWithMeta | null>(null);

  async function togglePin(note: NoteWithMeta) {
    await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !note.isPinned }),
    });
    mutate();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this note?")) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Notes & Brainstorming"
        description="Quick capture for ideas before they become official docs — the idea backlog lives here too."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New note
          </Button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(notes ?? []).map((n) => (
          <Card
            key={n.id}
            className="cursor-pointer hover:border-primary/50"
            onClick={() => {
              setEditing(n);
              setDialogOpen(true);
            }}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-base">{n.title}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePin(n);
                  }}
                >
                  <Pin className={n.isPinned ? "h-3.5 w-3.5 fill-current" : "h-3.5 w-3.5"} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(n.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-2">
                {noteTypeLabels[n.type]}
              </Badge>
              <p className="line-clamp-3 text-sm text-muted-foreground">{n.content || "No content yet."}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {n.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {n.author.name} · {format(new Date(n.updatedAt), "MMM d, yyyy")}
              </p>
            </CardContent>
          </Card>
        ))}
        {(notes ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No notes yet — capture your first idea.</p>
        )}
      </div>

      <NoteDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        note={editing}
        onSaved={() => mutate()}
      />
    </div>
  );
}
