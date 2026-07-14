"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface TimeEntryDTO {
  id: string;
  userId: string;
  taskId: string | null;
  projectId: string | null;
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number;
  isManual: boolean;
  isRunning: boolean;
  notes: string | null;
  user: { id: string; name: string; image: string | null };
  task: { id: string; title: string } | null;
  project: { id: string; name: string } | null;
}

export function useTimeEntries() {
  const { data, isLoading, mutate } = useSWR<TimeEntryDTO[]>("/api/time-entries", fetcher, {
    refreshInterval: 30000,
  });

  return { entries: data ?? [], isLoading, mutate };
}
