import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { format, startOfWeek, subWeeks, subMonths, startOfMonth } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultProject } from "@/lib/server-utils";

const WEEKS = 8;
const MONTHS = 6;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();

  const [tasks, timeEntries, expenses, checklistItems, milestones] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: project.id, isTemplate: false },
      select: { id: true, status: true, createdAt: true, updatedAt: true },
    }),
    prisma.timeEntry.findMany({ select: { startedAt: true, durationMinutes: true } }),
    prisma.expense.findMany({ where: { projectId: project.id }, select: { date: true, amount: true } }),
    prisma.launchChecklistItem.findMany({ select: { isComplete: true } }),
    prisma.milestone.findMany({ where: { projectId: project.id }, select: { status: true } }),
  ]);

  // Velocity: tasks marked DONE, bucketed by the week they were last updated.
  const weekBuckets: { weekStart: Date; label: string }[] = [];
  for (let i = WEEKS - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i));
    weekBuckets.push({ weekStart, label: format(weekStart, "MMM d") });
  }

  const velocity = weekBuckets.map(({ weekStart, label }) => {
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const completed = tasks.filter(
      (t) => t.status === "DONE" && t.updatedAt >= weekStart && t.updatedAt < nextWeek
    ).length;
    return { week: label, completed };
  });

  // Burn-down: total open (non-done) tasks as of the end of each week bucket.
  const burnDown = weekBuckets.map(({ weekStart, label }) => {
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const openAtWeekEnd = tasks.filter((t) => {
      const existedByThen = t.createdAt < nextWeek;
      const notYetDoneByThen = !(t.status === "DONE" && t.updatedAt < nextWeek);
      return existedByThen && notYetDoneByThen;
    }).length;
    return { week: label, open: openAtWeekEnd };
  });

  // Hours per week (productivity trend).
  const hoursByWeek = weekBuckets.map(({ weekStart, label }) => {
    const nextWeek = new Date(weekStart);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const minutes = timeEntries
      .filter((e) => e.startedAt >= weekStart && e.startedAt < nextWeek)
      .reduce((sum, e) => sum + e.durationMinutes, 0);
    return { week: label, hours: Number((minutes / 60).toFixed(1)) };
  });

  // Budget trend by month.
  const monthBuckets: { monthStart: Date; label: string }[] = [];
  for (let i = MONTHS - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    monthBuckets.push({ monthStart, label: format(monthStart, "MMM yyyy") });
  }
  const budgetByMonth = monthBuckets.map(({ monthStart, label }) => {
    const nextMonth = new Date(monthStart);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const amount = expenses
      .filter((e) => e.date >= monthStart && e.date < nextMonth)
      .reduce((sum, e) => sum + Number(e.amount), 0);
    return { month: label, amount: Number(amount.toFixed(2)) };
  });

  // Launch readiness score: blended completion across tasks, checklist, and milestones.
  const taskPct = tasks.length > 0 ? (tasks.filter((t) => t.status === "DONE").length / tasks.length) * 100 : 0;
  const checklistPct =
    checklistItems.length > 0
      ? (checklistItems.filter((c) => c.isComplete).length / checklistItems.length) * 100
      : 0;
  const milestonePct =
    milestones.length > 0
      ? (milestones.filter((m) => m.status === "COMPLETE").length / milestones.length) * 100
      : 0;

  const components = [
    { label: "Tasks complete", value: taskPct, weight: taskPct > 0 || tasks.length > 0 ? 1 : 0 },
    { label: "Launch checklist", value: checklistPct, weight: checklistItems.length > 0 ? 1 : 0 },
    { label: "Milestones", value: milestonePct, weight: milestones.length > 0 ? 1 : 0 },
  ];
  const activeComponents = components.filter((c) => c.weight > 0);
  const launchReadinessScore =
    activeComponents.length > 0
      ? Math.round(activeComponents.reduce((sum, c) => sum + c.value, 0) / activeComponents.length)
      : 0;

  return NextResponse.json({
    velocity,
    burnDown,
    hoursByWeek,
    budgetByMonth,
    launchReadinessScore,
    readinessComponents: components,
  });
}
