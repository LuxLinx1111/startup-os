import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultProject } from "@/lib/server-utils";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "task" | "milestone" | "meeting" | "marketing";
  href: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  const events: CalendarEvent[] = [
    ...tasks.map((t) => ({ id: t.id, title: t.title, date: t.dueDate!.toISOString(), type: "task" as const, href: `/tasks?taskId=${t.id}` })),
    ...milestones.map((m) => ({ id: m.id, title: m.name, date: m.targetDate!.toISOString(), type: "milestone" as const, href: "/milestones" })),
    ...meetings.map((m) => ({ id: m.id, title: m.title, date: m.scheduledAt!.toISOString(), type: "meeting" as const, href: "/meetings" })),
    ...marketing.map((m) => ({ id: m.id, title: m.title, date: m.scheduledDate!.toISOString(), type: "marketing" as const, href: "/marketing" })),
  ];

  return NextResponse.json(events);
}
