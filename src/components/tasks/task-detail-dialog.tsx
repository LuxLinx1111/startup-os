"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Plus, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUsers } from "@/hooks/use-tasks";
import { initials, statusLabels } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/task-include";
import { useToast } from "@/components/ui/use-toast";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface TaskDetailDialogProps {
  taskId: string | null; // "new" for create mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function TaskDetailDialog({ taskId, open, onOpenChange, onChanged }: TaskDetailDialogProps) {
  const isNew = taskId === "new";
  const { data: task, mutate } = useSWR<TaskWithRelations>(
    open && taskId && !isNew ? `/api/tasks/${taskId}` : null,
    fetcher
  );
  const { users } = useUsers();
  const { toast } = useToast();
  const { data: milestones } = useSWR<{ id: string; name: string }[]>("/api/milestones", fetcher);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState<string>("");
  const [priority, setPriority] = useState("MEDIUM");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("");
  const [milestoneId, setMilestoneId] = useState<string>("");
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) {
      setTitle("");
      setDescription("");
      setOwnerId("");
      setPriority("MEDIUM");
      setStatus("TODO");
      setDueDate("");
      setEstimatedHours("");
      setTagsInput("");
      setIsRecurring(false);
      setRecurrenceRule("");
      setMilestoneId("");
    } else if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setOwnerId(task.ownerId ?? "");
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
      setEstimatedHours(task.estimatedHours ? String(task.estimatedHours) : "");
      setTagsInput(task.tags.map((t) => t.tag.name).join(", "));
      setIsRecurring(task.isRecurring);
      setRecurrenceRule(task.recurrenceRule ?? "");
      setMilestoneId(task.milestoneId ?? "");
    }
  }, [task, isNew, taskId]);

  async function handleSave() {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      title,
      description: description || null,
      ownerId: ownerId || null,
      priority,
      status,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estimatedHours: estimatedHours ? Number(estimatedHours) : null,
      tagNames: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule || null : null,
      milestoneId: milestoneId || null,
    };

    try {
      if (isNew) {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast({ title: "Task created" });
      } else {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        await mutate();
        toast({ title: "Task saved" });
      }
      onChanged();
      onOpenChange(false);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!taskId || isNew) return;
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    onChanged();
    onOpenChange(false);
  }

  async function addChecklistItem() {
    if (!newChecklistLabel.trim() || !taskId) return;
    await fetch("/api/checklist-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, label: newChecklistLabel }),
    });
    setNewChecklistLabel("");
    mutate();
    onChanged();
  }

  async function toggleChecklistItem(id: string, isDone: boolean) {
    await fetch(`/api/checklist-items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDone }),
    });
    mutate();
  }

  async function removeChecklistItem(id: string) {
    await fetch(`/api/checklist-items/${id}`, { method: "DELETE" });
    mutate();
  }

  async function addComment() {
    if (!newComment.trim() || !taskId) return;
    await fetch("/api/task-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, body: newComment }),
    });
    setNewComment("");
    mutate();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isNew ? "New Task" : "Task Details"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            {!isNew && <TabsTrigger value="checklist">Checklist ({task?.checklist.length ?? 0})</TabsTrigger>}
            {!isNew && <TabsTrigger value="comments">Comments ({task?.comments.length ?? 0})</TabsTrigger>}
            {!isNew && <TabsTrigger value="related">Related</TabsTrigger>}
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Markdown supported"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Select value={ownerId || "unassigned"} onValueChange={(v) => setOwnerId(v === "unassigned" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimatedHours">Estimated hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  min={0}
                  step={0.5}
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Actual hours (logged)</Label>
                <Input
                  disabled
                  value={
                    task
                      ? (task.timeEntries.reduce((s, e) => s + e.durationMinutes, 0) / 60).toFixed(1)
                      : "0.0"
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Milestone (optional)</Label>
              <Select value={milestoneId || "none"} onValueChange={(v) => setMilestoneId(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="No milestone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No milestone</SelectItem>
                  {milestones?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="ios, backend, urgent"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox checked={isRecurring} onCheckedChange={(c) => setIsRecurring(c === true)} id="recurring" />
              <Label htmlFor="recurring" className="font-normal">
                Recurring task
              </Label>
              {isRecurring && (
                <Input
                  className="ml-2 w-56"
                  placeholder="e.g. FREQ=WEEKLY;INTERVAL=1"
                  value={recurrenceRule}
                  onChange={(e) => setRecurrenceRule(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-between pt-2">
              {!isNew ? (
                <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              ) : (
                <span />
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : isNew ? "Create task" : "Save changes"}
              </Button>
            </div>
          </TabsContent>

          {!isNew && (
            <TabsContent value="checklist" className="space-y-3">
              <div className="space-y-2">
                {task?.checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={item.isDone}
                      onCheckedChange={(checked) => toggleChecklistItem(item.id, checked === true)}
                    />
                    <span className={item.isDone ? "flex-1 text-sm line-through text-muted-foreground" : "flex-1 text-sm"}>
                      {item.label}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => removeChecklistItem(item.id)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                {task?.checklist.length === 0 && (
                  <p className="text-sm text-muted-foreground">No checklist items yet.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newChecklistLabel}
                  onChange={(e) => setNewChecklistLabel(e.target.value)}
                  placeholder="Add a checklist item"
                  onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                />
                <Button onClick={addChecklistItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          )}

          {!isNew && (
            <TabsContent value="comments" className="space-y-3">
              <div className="max-h-64 space-y-3 overflow-y-auto">
                {task?.comments.map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={c.author.image ?? undefined} />
                      <AvatarFallback className="text-[10px]">{initials(c.author.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-md bg-muted/50 p-2">
                      <p className="text-xs font-medium">
                        {c.author.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          {format(new Date(c.createdAt), "MMM d, h:mm a")}
                        </span>
                      </p>
                      <p className="text-sm">{c.body}</p>
                    </div>
                  </div>
                ))}
                {task?.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
              </div>
              <Separator />
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                />
                <Button onClick={addComment} className="self-end">
                  Post
                </Button>
              </div>
            </TabsContent>
          )}

          {!isNew && (
            <TabsContent value="related" className="space-y-3">
              <div className="space-y-1.5">
                {task?.relationsFrom.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>
                      {r.type.replace("_", " ").toLowerCase()} — {r.relatedTask.title}
                    </span>
                    <Badge variant="outline">{statusLabels[r.relatedTask.status]}</Badge>
                  </div>
                ))}
                {task?.relationsTo.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span>
                      {r.type.replace("_", " ").toLowerCase()} by — {r.task.title}
                    </span>
                    <Badge variant="outline">{statusLabels[r.task.status]}</Badge>
                  </div>
                ))}
                {task && task.relationsFrom.length === 0 && task.relationsTo.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No related tasks yet. Link dependencies from the API (`/api/task-relations`) — a
                    quick-link picker UI is a natural next add-on here.
                  </p>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
