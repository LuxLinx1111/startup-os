import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultProject } from "@/lib/server-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const weekStart = startOfWeek(today);
  const weekEnd = endOfWeek(today);

  const [
    totalTasks,
    doneTasks,
    tasksDueToday,
    upcomingMilestones,
    todayEntries,
    weekEntries,
    recentActivity,
    openIssues,
    tasksCompletedThisWeek,
    expenseSum,
    allTasksForStatus,
  ] = await Promise.all([
    prisma.task.count({ where: { projectId: project.id, isTemplate: false } }),
    prisma.task.count({ where: { projectId: project.id, isTemplate: false, status: "DONE" } }),
    prisma.task.findMany({
      where: {
        projectId: project.id,
        isTemplate: false,
        status: { not: "DONE" },
        dueDate: { gte: todayStart, lte: todayEnd },
      },
      select: { id: true, title: true, priority: true },
      take: 10,
    }),
    prisma.milestone.findMany({
      where: { projectId: project.id, status: { not: "COMPLETE" } },
      orderBy: { targetDate: "asc" },
      take: 5,
    }),
    prisma.timeEntry.aggregate({
      where: { startedAt: { gte: todayStart, lte: todayEnd } },
      _sum: { durationMinutes: true },
    }),
    prisma.timeEntry.aggregate({
      where: { startedAt: { gte: weekStart, lte: weekEnd } },
      _sum: { durationMinutes: true },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { name: true, image: true } } },
    }),
    prisma.bug.count({ where: { status: "OPEN" } }),
    prisma.task.count({
      where: { projectId: project.id, status: "DONE", updatedAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.expense.aggregate({ where: { projectId: project.id }, _sum: { amount: true } }),
    prisma.task.findMany({
      where: { projectId: project.id, isTemplate: false },
      select: { status: true, tags: { select: { tag: { select: { name: true } } } } },
    }),
  ]);

  const completionPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const marketingTasks = allTasksForStatus.filter((t) =>
    t.tags.some((tt) => tt.tag.name.toLowerCase() === "marketing")
  );
  const devTasks = allTasksForStatus.filter(
    (t) => !t.tags.some((tt) => tt.tag.name.toLowerCase() === "marketing")
  );
  const pctDone = (arr: typeof allTasksForStatus) =>
    arr.length > 0 ? Math.round((arr.filter((t) => t.status === "DONE").length / arr.length) * 100) : 0;

  const budgetTotal = project.budgetTotal ? Number(project.budgetTotal) : null;
  const spent = Number(expenseSum._sum.amount ?? 0);

  const sprintTarget = allTasksForStatus.filter((t) => t.status !== "BACKLOG").length;

  return NextResponse.json({
    project: {
      name: project.name,
      targetLaunchDate: project.targetLaunchDate,
      budgetTotal,
    },
    completionPercent,
    totalTasks,
    doneTasks,
    tasksDueToday,
    upcomingMilestones,
    hoursToday: (todayEntries._sum.durationMinutes ?? 0) / 60,
    hoursThisWeek: (weekEntries._sum.durationMinutes ?? 0) / 60,
    budgetTotal,
    budgetSpent: spent,
    budgetRemaining: budgetTotal !== null ? budgetTotal - spent : null,
    recentActivity,
    openIssues,
    sprintProgress: sprintTarget > 0 ? Math.round((tasksCompletedThisWeek / sprintTarget) * 100) : 0,
    tasksCompletedThisWeek,
    devStatusPercent: pctDone(devTasks),
    marketingStatusPercent: pctDone(marketingTasks),
    marketingTaskCount: marketingTasks.length,
    devTaskCount: devTasks.length,
  });
}
