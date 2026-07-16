import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultProject } from "@/lib/server-utils";
import { isGoogleCalendarConnected, syncEventsToGoogle, type SyncableEvent } from "@/lib/google-calendar";

// On-demand sync: there's no background job runner in this app, so "sync" means
// "push everything with a date into Google Calendar right now," triggered by the
// user clicking Sync on their Account page. Reuses the same four data sources the
// existing internal Shared Calendar aggregates (tasks, milestones, meetings, marketing).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  if (!(await isGoogleCalendarConnected(userId))) {
    return NextResponse.json({ error: "Google Calendar is not connected." }, { status: 400 });
  }

  const project = await getDefaultProject();

  const [tasks, milestones, meetings, marketing] = await Promise.all([
    prisma.task.findMany({
      where: { projectId: project.id, dueDate: { not: null }, isTemplate: false },
      select: { id: true, title: true, dueDate: true },
    }),
    prisma.milestone.findMany({
      where: { projectId: project.id, targetDate: { not: null } },
      select: { id: true, name: true, targetDate: true },
    }),
    prisma.meeting.findMany({
      where: { scheduledAt: { not: null } },
      select: { id: true, title: true, scheduledAt: true },
    }),
    prisma.marketingItem.findMany({
      where: { scheduledDate: { not: null } },
      select: { id: true, title: true, scheduledDate: true },
    }),
  ]);

  const events: SyncableEvent[] = [
    ...tasks.map((t) => ({
      sourceType: "task" as const,
      sourceId: t.id,
      title: `Task due: ${t.title}`,
      date: t.dueDate!,
    })),
    ...milestones.map((m) => ({
      sourceType: "milestone" as const,
      sourceId: m.id,
      title: `Milestone: ${m.name}`,
      date: m.targetDate!,
    })),
    ...meetings.map((m) => ({
      sourceType: "meeting" as const,
      sourceId: m.id,
      title: `Meeting: ${m.title}`,
      date: m.scheduledAt!,
    })),
    ...marketing.map((m) => ({
      sourceType: "marketing" as const,
      sourceId: m.id,
      title: `Marketing: ${m.title}`,
      date: m.scheduledDate!,
    })),
  ];

  const result = await syncEventsToGoogle(userId, events);
  return NextResponse.json(result);
}
