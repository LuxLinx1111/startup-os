"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { FileText, ListChecks, Timer } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SearchResults {
  tasks: { id: string; title: string; status: string }[];
  wikiPages: { id: string; title: string; slug: string }[];
  timeEntries: { id: string; notes: string | null; durationMinutes: number }[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const { data } = useSWR<SearchResults>(
    query.length >= 2 ? `/api/search?q=${encodeURIComponent(query)}` : null,
    fetcher
  );

  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search tasks, wiki, time logs..." value={query} onValueChange={setQuery} />
      <CommandList>
        {query.length < 2 && (
          <CommandEmpty>Type at least 2 characters to search across the workspace.</CommandEmpty>
        )}
        {query.length >= 2 && !data && <CommandEmpty>Searching...</CommandEmpty>}
        {data && !data.tasks.length && !data.wikiPages.length && !data.timeEntries.length && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}
        {data && data.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {data.tasks.map((t) => (
              <CommandItem key={t.id} onSelect={() => go(`/tasks?taskId=${t.id}`)}>
                <ListChecks className="mr-1" />
                {t.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data && data.wikiPages.length > 0 && (
          <CommandGroup heading="Wiki">
            {data.wikiPages.map((p) => (
              <CommandItem key={p.id} onSelect={() => go(`/wiki/${p.slug}`)}>
                <FileText className="mr-1" />
                {p.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {data && data.timeEntries.length > 0 && (
          <CommandGroup heading="Time Entries">
            {data.timeEntries.map((t) => (
              <CommandItem key={t.id} onSelect={() => go(`/time`)}>
                <Timer className="mr-1" />
                {t.notes || "Time entry"} — {(t.durationMinutes / 60).toFixed(1)}h
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
