"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { ExternalLink, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
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

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Asset {
  id: string;
  name: string;
  type: string;
  tags: string[];
  file: { url: string } | null;
}

const typeLabels: Record<string, string> = {
  LOGO: "Logo",
  COLOR: "Color",
  ICON: "Icon",
  SCREENSHOT: "Screenshot",
  GRAPHIC: "Graphic",
  DESIGN_FILE: "Design File",
};

function AssetDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("GRAPHIC");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setType("GRAPHIC");
      setUrl("");
      setTags("");
    }
  }, [open]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          url: url || null,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
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
          <DialogTitle>Add asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Primary logo (dark)" />
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
            <Label>Link (Drive, Figma, Dropbox...)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="brand, dark-mode" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Add asset"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AssetsPage() {
  const { data: assets, mutate } = useSWR<Asset[]>("/api/assets", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  async function remove(id: string) {
    await fetch(`/api/assets/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div>
      <PageHeader
        title="Asset Library"
        description="Logos, brand colors, app icons, screenshots, and design files — linked from wherever they actually live."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add asset
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(assets ?? []).map((a) => (
          <Card key={a.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex h-20 items-center justify-center rounded-md bg-muted">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="truncate text-sm font-medium">{a.name}</p>
              <Badge variant="secondary">{typeLabels[a.type]}</Badge>
              <div className="flex flex-wrap gap-1">
                {a.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] font-normal">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                {a.file?.url ? (
                  <a
                    href={a.file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Open
                  </a>
                ) : (
                  <span />
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(a.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(assets ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No assets added yet.</p>
        )}
      </div>

      <AssetDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => mutate()} />
    </div>
  );
}
