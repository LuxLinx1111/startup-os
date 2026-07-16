"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { Pencil, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { initials } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TeamMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  title: string | null;
  skills: string[];
  ownershipAreas: string[];
  decisionAuthority: string | null;
}

function EditMemberDialog({
  member,
  open,
  onOpenChange,
  onSaved,
}: {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [skills, setSkills] = useState("");
  const [ownership, setOwnership] = useState("");
  const [authority, setAuthority] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setTitle(member.title ?? "");
      setSkills(member.skills.join(", "));
      setOwnership(member.ownershipAreas.join(", "));
      setAuthority(member.decisionAuthority ?? "");
    }
  }, [member]);

  async function handleSave() {
    if (!member) return;
    setSaving(true);
    try {
      await fetch(`/api/users/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || null,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
          ownershipAreas: ownership.split(",").map((s) => s.trim()).filter(Boolean),
          decisionAuthority: authority || null,
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
          <DialogTitle>Edit {member?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title / role</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Founder / Engineering" />
          </div>
          <div className="space-y-1.5">
            <Label>Skills (comma separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Product, Engineering, Design" />
          </div>
          <div className="space-y-1.5">
            <Label>Areas of ownership (comma separated)</Label>
            <Input value={ownership} onChange={(e) => setOwnership(e.target.value)} placeholder="Product, App development" />
          </div>
          <div className="space-y-1.5">
            <Label>Decision authority</Label>
            <Textarea value={authority} onChange={(e) => setAuthority(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function OrgPage() {
  const { data: members, mutate } = useSWR<TeamMember[]>("/api/users", fetcher);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Org & Team"
        description="Who's who, what they own, and who decides what — built to grow past two people."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {(members ?? []).map((m) => (
          <Card key={m.id}>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={m.image ?? undefined} />
                <AvatarFallback>{initials(m.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle>{m.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{m.title || "No title set"}</p>
              </div>
              <Badge variant="secondary">{m.role}</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditing(m);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {m.skills.length > 0 ? (
                    m.skills.map((s) => (
                      <Badge key={s} variant="outline" className="font-normal">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Not set</span>
                  )}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Ownership areas</p>
                <div className="flex flex-wrap gap-1">
                  {m.ownershipAreas.length > 0 ? (
                    m.ownershipAreas.map((s) => (
                      <Badge key={s} variant="outline" className="font-normal">
                        {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">Not set</span>
                  )}
                </div>
              </div>
              {m.decisionAuthority && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">Decision authority</p>
                  <p className="text-sm text-muted-foreground">{m.decisionAuthority}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">{m.email}</p>
            </CardContent>
          </Card>
        ))}
        {(members ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Growing the team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Every role, permission, and ownership field here is already modeled per-person — adding a third
            teammate later is just creating a new account (Settings → and eventually an invite flow), not a
            redesign of this page.
          </p>
        </CardContent>
      </Card>

      <EditMemberDialog member={editing} open={open} onOpenChange={setOpen} onSaved={() => mutate()} />
    </div>
  );
}
