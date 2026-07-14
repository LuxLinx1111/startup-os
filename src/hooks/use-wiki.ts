"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface WikiPageSummary {
  id: string;
  title: string;
  slug: string;
  category: string;
  isPinned: boolean;
  tags: string[];
  updatedAt: string;
  author: { name: string; image: string | null };
}

export function useWikiPages(query?: string) {
  const { data, mutate, isLoading } = useSWR<WikiPageSummary[]>(
    `/api/wiki${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    fetcher
  );
  return { pages: data ?? [], mutate, isLoading };
}

export interface WikiPageFull extends WikiPageSummary {
  content: string;
  revisions: { id: string; content: string; createdAt: string; editedBy: { name: string } }[];
}

export function useWikiPage(slug: string | null) {
  const { data, mutate } = useSWR<WikiPageFull>(slug ? `/api/wiki/${slug}` : null, fetcher);
  return { page: data, mutate };
}
