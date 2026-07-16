"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { NewWikiPageDialog } from "@/components/wiki/new-wiki-page-dialog";

function WikiIndexInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("new")) setOpen(true);
  }, [searchParams]);

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
      <p className="text-lg font-medium">Your company wiki</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Select a page from the sidebar, or create a new one for meeting notes, PRDs, business plans,
        technical docs, and more.
      </p>
      <NewWikiPageDialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) router.replace("/wiki");
        }}
        onCreated={(slug) => router.push(`/wiki/${slug}`)}
      />
    </div>
  );
}

export default function WikiIndexPage() {
  return (
    <Suspense fallback={null}>
      <WikiIndexInner />
    </Suspense>
  );
}
