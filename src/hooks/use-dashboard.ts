"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface DashboardSummary {
  project: { name: string; targetLaunchDate: string | null; budgetTotal: number | null };
  completionPercent: number;
  totalTasks: number;
  doneTasks: number;
  tasksDueToday: { id: string; title: string; priority: string }[];
  upcomingMilestones: { id: string; name: string; targetDate: string | null; status: string }[];
  hoursToday: number;
  hoursThisWeek: number;
  budgetTotal: number | null;
  budgetSpent: number;
  budgetRemaining: number | null;
  recentActivity: { id: string; summary: string; createdAt: string; actor: { name: string } }[];
  openIssues: number;
  sprintProgress: number;
  tasksCompletedThisWeek: number;
  devStatusPercent: number;
  marketingStatusPercent: number;
  marketingTaskCount: number;
  devTaskCount: number;
}

export function useDashboard() {
  const { data, isLoading, mutate } = useSWR<DashboardSummary>("/api/dashboard/summary", fetcher, {
    refreshInterval: 60000,
  });
  return { summary: data, isLoading, mutate };
}
