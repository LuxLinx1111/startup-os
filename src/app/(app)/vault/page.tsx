"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Copy, Eye, EyeOff, KeyRound, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VaultItem {
  id: string;
  name: string;
  category: string;
  notes: string | null;
  lastRotatedAt: string | null;
  hint: string;
  owner: { name: string };
}

const categoryLabels: Record<string, string> = {
  API_KEY: "API Key",
  PASSWORD: "Password",
  LICENSE: "License",
  SERVICE: "Service",
};

function VaultDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("API_KEY");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setCategory("API_KEY");
      setValue("");
      setNotes("");
    }
  }, [open]);

  async function handleSave() {
    if (!name.trim() || !value.trim()) return;
    setSaving(true);
    try {
      await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, value, notes: notes || null }),
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
          <DialogTitle>Add vault item</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Stripe secret key" />
          </div>
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
            <Label>Value</Label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} type="password" placeholder="Encrypted before it's saved" />
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Encrypting & saving..." : "Save to vault"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VaultRow({ item, onDeleted }: { item: VaultItem; onDeleted: () => void }) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function fetchValue(): Promise<string> {
    const res = await fetch(`/api/vault/${item.id}/reveal`);
    const data = await res.json();
    return data.value as string;
  }

  async function reveal() {
    if (revealed) {
      setRevealed(null);
      return;
    }
    setLoading(true);
    try {
      setRevealed(await fetchValue());
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    const value = revealed ?? (await fetchValue());
    await navigator.clipboard.writeText(value);
    toast({ title: "Copied to clipboard" });
  }

  async function remove() {
    if (!confirm(`Delete "${item.name}" from the vault?`)) return;
    await fetch(`/api/vault/${item.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" />
            <span className="font-medium">{item.name}</span>
            <Badge variant="secondary">{categoryLabels[item.category]}</Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {loading ? "Decrypting..." : revealed ?? item.hint}
          </p>
          {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
          {item.lastRotatedAt && (
            <p className="text-xs text-muted-foreground">
              Last rotated {format(new Date(item.lastRotatedAt), "MMM d, yyyy")}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" onClick={reveal}>
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={copy}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={remove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function VaultPage() {
  const { data: items, mutate } = useSWR<VaultItem[]>("/api/vault", fetcher);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Password & API Vault"
        description="API keys, passwords, and licenses — encrypted (AES-256) before they're ever written to the database."
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add item
          </Button>
        }
      />

      <div className="space-y-3">
        {(items ?? []).map((item) => (
          <VaultRow key={item.id} item={item} onDeleted={() => mutate()} />
        ))}
        {(items ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nothing stored yet. Make sure VAULT_ENCRYPTION_KEY is set in your .env before adding items.
          </p>
        )}
      </div>

      <VaultDialog open={dialogOpen} onOpenChange={setDialogOpen} onSaved={() => mutate()} />
    </div>
  );
}
