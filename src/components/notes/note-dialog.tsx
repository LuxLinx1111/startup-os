"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarkdownEditor } from "@/components/wiki/markdown-editor";
import { noteTypeLabels } from "@/lib/utils";

export interface NoteDTO {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  isPinned: boolean;
}

export function NoteDialog({
  open,
  onOpenChange,
  note,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  note?: NoteDTO | null;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("NOTE");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setType(note.type);
      setTagsInput(note.tags.join(", "));
      setContent(note.content);
    } else if (open) {
      setTitle("");
      setType("NOTE");
      setTagsInput("");
      setContent("");
    }
  }, [note, open]);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title,
      type,
      content,
      tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
    };
    try {
      if (note) {
        await fetch(`/api/notes/${note.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/notes", {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(noteTypeLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma separated)</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>
          <MarkdownEditor value={content} onChange={setContent} />
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
