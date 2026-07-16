"use client";

import useSWR from "swr";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Rocket } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Analytics {
  velocity: { week: string; completed: number }[];
  burnDown: { week: string; open: number }[];
  hoursByWeek: { week: string; hours: number }[];
  budgetByMonth: { month: string; amount: number }[];
  launchReadinessScore: number;
  readinessComponents: { label: string; value: number; weight: number }[];
}

export default function ReportsPage() {
  const { data } = useSWR<Analytics>("/api/reports/analytics", fetcher);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reports & Analytics"
        description="Velocity, burn-down, productivity, budget trends, and an overall launch readiness score."
      />

      <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-6">
          <div className="flex items-center gap-3">
            <Rocket className="h-8 w-8" />
            <div>
              <p className="text-sm opacity-80">Launch readiness score</p>
              <p className="text-3xl font-bold">{data?.launchReadinessScore ?? 0}%</p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap gap-4">
            {data?.readinessComponents
              .filter((c) => c.weight > 0)
              .map((c) => (
                <div key={c.label} className="min-w-[140px]">
                  <p className="mb-1 text-xs opacity-80">{c.label}</p>
                  <Progress value={c.value} className="bg-white/20" indicatorClassName="bg-white" />
                </div>
              ))}
            {data?.readinessComponents.every((c) => c.weight === 0) && (
              <p className="text-sm opacity-80">Add tasks, checklist items, or milestones to compute this.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Velocity (tasks completed / week)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.velocity ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Burn-down (open tasks remaining)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.burnDown ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="open" stroke="#ef4444" fill="#ef444433" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity (hours / week)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.hoursByWeek ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget trend (spend / month)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.budgetByMonth ?? []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
