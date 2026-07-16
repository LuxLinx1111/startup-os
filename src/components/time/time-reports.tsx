"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimeEntries } from "@/hooks/use-time-entries";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#0ea5e9", "#a855f7"];

type Period = "daily" | "weekly" | "monthly" | "yearly";

function bucketKey(date: Date, period: Period) {
  switch (period) {
    case "daily":
      return format(date, "yyyy-MM-dd");
    case "weekly":
      return format(startOfWeek(date), "yyyy-MM-dd");
    case "monthly":
      return format(startOfMonth(date), "yyyy-MM");
    case "yearly":
      return format(startOfYear(date), "yyyy");
  }
}

export function TimeReports() {
  const { entries } = useTimeEntries();
  const [period, setPeriod] = useState<Period>("daily");

  const byPeriod = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const key = bucketKey(new Date(e.startedAt), period);
      map.set(key, (map.get(key) ?? 0) + e.durationMinutes / 60);
    }
    return Array.from(map.entries())
      .map(([key, hours]) => ({ key, hours: Number(hours.toFixed(2)) }))
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-14);
  }, [entries, period]);

  const byProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const key = e.project?.name ?? "Unassigned";
      map.set(key, (map.get(key) ?? 0) + e.durationMinutes / 60);
    }
    return Array.from(map.entries()).map(([name, hours]) => ({ name, hours: Number(hours.toFixed(2)) }));
  }, [entries]);

  const byPerson = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.user.name, (map.get(e.user.name) ?? 0) + e.durationMinutes / 60);
    }
    return Array.from(map.entries()).map(([name, hours]) => ({ name, hours: Number(hours.toFixed(2)) }));
  }, [entries]);

  return (
    <div className="space-y-4">
      <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hours over time ({period})</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPeriod}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hours by project</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={byProject} dataKey="hours" nameKey="name" outerRadius={90} label>
                  {byProject.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hours by person</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPerson} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                <Tooltip />
                <Bar dataKey="hours" fill="#22c55e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
