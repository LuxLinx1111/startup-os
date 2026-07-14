"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pin, PinOff, Trash2, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MarkdownEditor } from "@/components/wiki/markdown-editor";
import { useWikiPage } from "@/hooks/use-wiki";
import { wikiCategories, wikiCategoryLabels } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export default function WikiPageDetail() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { page, mutate } = useWikiPage(params.slug);
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [tagsInput, setTagsInput] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setCategory(page.category);
      setTagsInput(page.tags.join(", "));
      setContent(page.content);
      setIsPinned(page.isPinned);
      isFirstLoad.current = true;
    }
  }, [page?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave content changes (debounced).
  useEffect(() => {
    if (!page) return;
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    setSaveState("saving");
    const timeout = setTimeout(async () => {
      await fetch(`/api/wiki/${params.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      setSaveState("saved");
      mutate();
    }, 1200);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  async function saveMeta(partial: Record<string, unknown>) {
    await fetch(`/api/wiki/${params.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    mutate();
  }

  async function handleDelete() {
    if (!confirm("Delete this wiki page?")) return;
    await fetch(`/api/wiki/${params.slug}`, { method: "DELETE" });
    router.push("/wiki");
  }

  if (!page) {
    return <p className="p-4 text-sm text-muted-foreground">Loading page...</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== page.title && saveMeta({ title })}
          className="border-none px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved" : ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setIsPinned(!isPinned);
              saveMeta({ isPinned: !isPinned });
            }}
          >
            {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <History className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="max-h-72 overflow-y-auto">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Version history</p>
              {page.revisions.length === 0 && (
                <p className="text-sm text-muted-foreground">No previous versions yet.</p>
              )}
              {page.revisions.map((r) => (
                <div key={r.id} className="border-b py-2 text-xs last:border-b-0">
                  <p className="font-medium">{r.editedBy.name}</p>
                  <p className="text-muted-foreground">{format(new Date(r.createdAt), "MMM d, yyyy h:mm a")}</p>
                </div>
              ))}
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            saveMeta({ category: v });
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {wikiCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {wikiCategoryLabels[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-64"
          placeholder="Tags (comma separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          onBlur={() =>
            saveMeta({ tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean) })
          }
        />
        {page.tags.map((t) => (
          <Badge key={t} variant="outline">
            {t}
          </Badge>
        ))}
      </div>

      <MarkdownEditor value={content} onChange={setContent} />
    </div>
  );
}
