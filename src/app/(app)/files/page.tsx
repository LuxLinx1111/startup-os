"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { ExternalLink, File as FileIcon, FolderPlus, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Folder {
  id: string;
  name: string;
  parentId: string | null;
}

interface FileItem {
  id: string;
  name: string;
  url: string;
  category: string;
  folderId: string | null;
  createdAt: string;
  uploadedBy: { name: string };
}

const categoryLabels: Record<string, string> = {
  DOCUMENT: "Document",
  IMAGE: "Image",
  DESIGN: "Design",
  CONTRACT: "Contract",
  OTHER: "Other",
};

function AddFileDialog({
  open,
  onOpenChange,
  folders,
  activeFolderId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  folders: Folder[];
  activeFolderId: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [folderId, setFolderId] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setUrl("");
      setCategory("OTHER");
      setFolderId(activeFolderId ?? "none");
    }
  }, [open, activeFolderId]);

  async function handleSave() {
    if (!name.trim() || !url.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, category, folderId: folderId === "none" ? null : folderId }),
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
          <DialogTitle>Add file link</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Founder agreement" />
          </div>
          <div className="space-y-1.5">
            <Label>Link (Drive, Dropbox, Notion...)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No folder</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add file"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FilesPage() {
  const [search, setSearch] = useState("");
  const { data: folders, mutate: mutateFolders } = useSWR<Folder[]>("/api/folders", fetcher);
  const { data: files, mutate: mutateFiles } = useSWR<FileItem[]>(
    `/api/files${search.length >= 2 ? `?q=${encodeURIComponent(search)}` : ""}`,
    fetcher
  );
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);

  const filtered = useMemo(
    () => (files ?? []).filter((f) => !activeFolderId || f.folderId === activeFolderId),
    [files, activeFolderId]
  );

  async function newFolder() {
    const name = prompt("Folder name");
    if (!name) return;
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    mutateFolders();
  }

  async function removeFile(id: string) {
    await fetch(`/api/files/${id}`, { method: "DELETE" });
    mutateFiles();
  }

  return (
    <div>
      <PageHeader
        title="File Manager"
        description="Company files, organized by folder — linked from Drive/Dropbox/Notion until real file storage is connected."
        actions={
          <Button onClick={() => setFileDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add file
          </Button>
        }
      />

      <div className="flex gap-4">
        <div className="w-48 shrink-0 space-y-1">
          <button
            onClick={() => setActiveFolderId(null)}
            className={cn(
              "block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
              activeFolderId === null && "bg-accent font-medium"
            )}
          >
            All files
          </button>
          {(folders ?? []).map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFolderId(f.id)}
              className={cn(
                "block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
                activeFolderId === f.id && "bg-accent font-medium"
              )}
            >
              {f.name}
            </button>
          ))}
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={newFolder}>
            <FolderPlus className="mr-1.5 h-3.5 w-3.5" /> New folder
          </Button>
        </div>

        <div className="flex-1 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search files..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((f) => (
              <Card key={f.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-4 w-4 text-primary" />
                    <span className="truncate text-sm font-medium">{f.name}</span>
                  </div>
                  <Badge variant="secondary">{categoryLabels[f.category]}</Badge>
                  <div className="flex items-center justify-between pt-1">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFile(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground">No files here yet.</p>
            )}
          </div>
        </div>
      </div>

      <AddFileDialog
        open={fileDialogOpen}
        onOpenChange={setFileDialogOpen}
        folders={folders ?? []}
        activeFolderId={activeFolderId}
        onSaved={() => mutateFiles()}
      />
    </div>
  );
}
