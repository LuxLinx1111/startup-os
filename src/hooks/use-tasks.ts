"use client";

import useSWR from "swr";
import type { TaskWithRelations } from "@/lib/task-include";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<TaskWithRelations[]>("/api/tasks", fetcher, {
    revalidateOnFocus: false,
  });

  return { tasks: data ?? [], error, isLoading, mutate };
}

export interface SimpleUser {
  id: string;
  name: string;
  image: string | null;
  role: string;
  title: string | null;
}

export function useUsers() {
  const { data } = useSWR<SimpleUser[]>("/api/users", fetcher);
  return { users: data ?? [] };
}
