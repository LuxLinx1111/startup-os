"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Pin, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWikiPages } from "@/hooks/use-wiki";
import { wikiCategoryLabels, cn } from "@/lib/utils";
import { NewWikiPageDialog } from "@/components/wiki/new-wiki-page-dialog";

export function WikiSidebar() {
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const { pages } = useWikiPages(search.length >= 2 ? search : undefined);
  const pathname = usePathname();
  const router = useRouter();

  const grouped = useMemo(() => {
    const map = new Map<string, typeof pages>();
    for (const p of pages) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return map;
  }, [pages]);

  const pinned = pages.filter((p) => p.isPinned);

  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r">
      <div className="space-y-2 border-b p-3">
        <div className="relative">
          <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search wiki..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button size="sm" className="w-full" onClick={() => setNewOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> New page
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {pinned.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 px-1 text-xs font-semibold uppercase text-muted-foreground">Pinned</p>
            {pinned.map((p) => (
              <Link
                key={p.id}
                href={`/wiki/${p.slug}`}
                className={cn(
                  "flex items-center gap-1.5 truncate rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                  pathname === `/wiki/${p.slug}` && "bg-accent font-medium"
                )}
              >
                <Pin className="h-3 w-3 shrink-0" />
                {p.title}
              </Link>
            ))}
          </div>
        )}
        {Array.from(grouped.entries()).map(([category, list]) => (
          <div key={category} className="mb-3">
            <p className="mb-1 px-1 text-xs font-semibold uppercase text-muted-foreground">
              {wikiCategoryLabels[category] ?? category}
            </p>
            {list.map((p) => (
              <Link
                key={p.id}
                href={`/wiki/${p.slug}`}
                className={cn(
                  "block truncate rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                  pathname === `/wiki/${p.slug}` && "bg-accent font-medium"
                )}
              >
                {p.title}
              </Link>
            ))}
          </div>
        ))}
        {pages.length === 0 && <p className="px-1 text-sm text-muted-foreground">No pages yet.</p>}
      </div>

      <NewWikiPageDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        onCreated={(slug) => router.push(`/wiki/${slug}`)}
      />
    </div>
  );
}
