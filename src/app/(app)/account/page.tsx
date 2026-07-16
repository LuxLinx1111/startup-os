"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useSession, signIn } from "next-auth/react";
import { Copy, RefreshCw, CalendarPlus, Unlink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Account {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  backupEmail: string | null;
  role: string;
  calendarFeedToken: string | null;
  googleConnected: boolean;
}

function ProfileTab({ account, mutate }: { account: Account | undefined; mutate: () => void }) {
  const { update } = useSession();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name ?? "");
      setEmail(account.email ?? "");
      setPhone(account.phone ?? "");
      setBackupEmail(account.backupEmail ?? "");
    }
  }, [account]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || null, backupEmail: backupEmail || null }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Couldn't save", description: data.error ?? "Something went wrong.", variant: "destructive" });
        return;
      }
      await mutate();
      // Session uses a JWT — force it to re-run the jwt() callback with fresh
      // name/email so the topbar avatar/name update immediately, no re-login needed.
      await update();
      toast({ title: "Profile saved" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your profile</CardTitle>
        <CardDescription>
          Name, phone, and email — visible to your co-founder, editable only by you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Primary email (used to log in)</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            Changing this changes what you use to sign in — double-check it before saving.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label>Phone number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. (555) 123-4567" />
        </div>
        <div className="space-y-1.5">
          <Label>Backup email</Label>
          <Input
            type="email"
            value={backupEmail}
            onChange={(e) => setBackupEmail(e.target.value)}
            placeholder="Optional — a second way to reach you"
          />
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </Button>
      </CardContent>
    </Card>
  );
}

function SecurityTab() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Use at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Couldn't change password", description: data.error ?? "Something went wrong.", variant: "destructive" });
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Password changed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
        <CardDescription>You'll need your current password to set a new one.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-1.5">
          <Label>Current password</Label>
          <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Confirm new password</Label>
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button onClick={handleChangePassword} disabled={saving}>
          {saving ? "Saving..." : "Change password"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CalendarsTab({ account, mutate }: { account: Account | undefined; mutate: () => void }) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [generatingFeed, setGeneratingFeed] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const feedUrl = account?.calendarFeedToken ? `${origin}/api/calendar/feed/${account.calendarFeedToken}` : null;

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch("/api/integrations/google/sync", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: "Sync failed", description: data.error ?? "Something went wrong.", variant: "destructive" });
        return;
      }
      toast({
        title: "Synced with Google Calendar",
        description: `${data.synced} event(s) synced${data.failed ? `, ${data.failed} failed` : ""}.`,
      });
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch("/api/integrations/google/disconnect", { method: "POST" });
      await mutate();
      toast({ title: "Google Calendar disconnected" });
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleGenerateFeed() {
    setGeneratingFeed(true);
    try {
      await fetch("/api/account/calendar-feed", { method: "POST" });
      await mutate();
      toast({ title: account?.calendarFeedToken ? "Feed link regenerated" : "Feed link created" });
    } finally {
      setGeneratingFeed(false);
    }
  }

  function copyFeedUrl() {
    if (!feedUrl) return;
    navigator.clipboard.writeText(feedUrl);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4" /> Google Calendar
          </CardTitle>
          <CardDescription>
            Pushes task due dates, milestones, meetings, and marketing dates into your Google Calendar as
            all-day events — reminders then come through Google's own notifications on your phone and Mac.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          {account?.googleConnected ? (
            <>
              <Badge variant="secondary">Connected</Badge>
              <Button onClick={handleSync} disabled={syncing}>
                {syncing ? "Syncing..." : "Sync now"}
              </Button>
              <Button variant="ghost" onClick={handleDisconnect} disabled={disconnecting}>
                <Unlink className="mr-2 h-4 w-4" />
                {disconnecting ? "Disconnecting..." : "Disconnect"}
              </Button>
            </>
          ) : (
            <Button onClick={() => signIn("google", { callbackUrl: "/account" })}>
              Connect Google Calendar
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Apple Calendar / iCloud (or any app)</CardTitle>
          <CardDescription>
            Subscribe to this link from Apple Calendar, Google Calendar, or Outlook and it'll show the same
            events, refreshing automatically on that app's own schedule. Anyone with this link can view (not
            edit) the calendar, so treat it like a password and regenerate it if it's ever shared by accident.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedUrl ? (
            <div className="flex items-center gap-2">
              <Input readOnly value={feedUrl} className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={copyFeedUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No feed link yet — create one below.</p>
          )}
          <Button variant="outline" onClick={handleGenerateFeed} disabled={generatingFeed}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {feedUrl ? (generatingFeed ? "Regenerating..." : "Regenerate link") : generatingFeed ? "Creating..." : "Create feed link"}
          </Button>
          <p className="text-xs text-muted-foreground">
            In Apple Calendar: File → New Calendar Subscription → paste the link. In Google Calendar: Other
            calendars → From URL → paste the link.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AccountPage() {
  const { data: account, mutate } = useSWR<Account>("/api/account", fetcher);

  return (
    <div>
      <PageHeader title="My Account" description="Your personal profile, password, and calendar connections." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="calendars">Calendars</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ProfileTab account={account} mutate={mutate} />
        </TabsContent>
        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>
        <TabsContent value="calendars">
          <CalendarsTab account={account} mutate={mutate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
