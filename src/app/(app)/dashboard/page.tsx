"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Wallet,
  Activity,
  Bug,
  Rocket,
  ListChecks,
  Timer,
  BookOpen,
  Flag,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn, formatCurrency, priorityColors } from "@/lib/utils";

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { summary, isLoading } = useDashboard();

  if (isLoading || !summary) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <p className="text-sm text-muted-foreground">Loading your workspace...</p>
      </div>
    );
  }

  const countdown = daysUntil(summary.project.targetLaunchDate);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back — ${summary.project.name}`}
        description="Here's where everything stands right now."
        actions={
          <>
            <Link href="/tasks?new=1">
              <Button size="sm" variant="outline">
                <ListChecks className="mr-1.5 h-4 w-4" /> New task
              </Button>
            </Link>
            <Link href="/time?start=1">
              <Button size="sm" variant="outline">
                <Timer className="mr-1.5 h-4 w-4" /> Start timer
              </Button>
            </Link>
            <Link href="/wiki?new=1">
              <Button size="sm" variant="outline">
                <BookOpen className="mr-1.5 h-4 w-4" /> New wiki page
              </Button>
            </Link>
          </>
        }
      />

      {/* Launch countdown hero */}
      <Card className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <Rocket className="h-8 w-8" />
            <div>
              <p className="text-sm opacity-80">Countdown to launch</p>
              <p className="text-3xl font-bold">
                {countdown === null
                  ? "Set a launch date"
                  : countdown >= 0
                  ? `${countdown} days`
                  : `${Math.abs(countdown)} days over`}
              </p>
            </div>
          </div>
          {countdown === null && (
            <Link href="/settings">
              <Button variant="secondary" size="sm">
                Set launch date
              </Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Hours today" value={summary.hoursToday.toFixed(1)} icon={Clock} />
        <StatCard label="Hours this week" value={summary.hoursThisWeek.toFixed(1)} icon={Clock} />
        <StatCard
          label="Budget remaining"
          value={summary.budgetRemaining !== null ? formatCurrency(summary.budgetRemaining) : "—"}
          hint={summary.budgetTotal ? `of ${formatCurrency(summary.budgetTotal)}` : "Set a budget in Settings"}
          icon={Wallet}
        />
        <StatCard label="Open issues" value={String(summary.openIssues)} icon={Bug} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Completion + sprint progress */}
        <Card>
          <CardHeader>
            <CardTitle>Project completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>{summary.doneTasks} / {summary.totalTasks} tasks done</span>
                <span className="font-medium">{summary.completionPercent}%</span>
              </div>
              <Progress value={summary.completionPercent} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>This week's progress</span>
                <span className="font-medium">{summary.sprintProgress}%</span>
              </div>
              <Progress value={summary.sprintProgress} indicatorClassName="bg-success" />
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.tasksCompletedThisWeek} tasks completed this week
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Dev vs Marketing status */}
        <Card>
          <CardHeader>
            <CardTitle>Dev &amp; marketing status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Development ({summary.devTaskCount} tasks)</span>
                <span className="font-medium">{summary.devStatusPercent}%</span>
              </div>
              <Progress value={summary.devStatusPercent} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Marketing ({summary.marketingTaskCount} tasks)</span>
                <span className="font-medium">{summary.marketingStatusPercent}%</span>
              </div>
              <Progress value={summary.marketingStatusPercent} indicatorClassName="bg-warning" />
            </div>
            <p className="text-xs text-muted-foreground">
              Tag a task "marketing" to have it count toward marketing status instead of dev.
            </p>
          </CardContent>
        </Card>

        {/* Due today */}
        <Card>
          <CardHeader>
            <CardTitle>Due today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.tasksDueToday.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing due today. 🎉</p>
            )}
            {summary.tasksDueToday.map((t) => (
              <Link
                key={t.id}
                href={`/tasks?taskId=${t.id}`}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", priorityColors[t.priority])} />
                <span className="truncate">{t.title}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-4 w-4" /> Upcoming milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.upcomingMilestones.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No milestones yet — Milestone tracking ships in Phase 2.
              </p>
            )}
            {summary.upcomingMilestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{m.name}</span>
                <Badge variant="outline">{m.status.replace("_", " ")}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recentActivity.length === 0 && (
              <p className="text-sm text-muted-foreground">No activity yet — go create something.</p>
            )}
            {summary.recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <p>{a.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
