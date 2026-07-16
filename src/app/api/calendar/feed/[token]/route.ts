import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDefaultProject } from "@/lib/server-utils";
import { buildIcsFeed, type IcsEvent } from "@/lib/ics";

// Deliberately NOT behind next-auth session middleware (see middleware.ts matcher) —
// Apple Calendar / Google Calendar / Outlook fetch this URL directly on their own
// refresh schedule with no login flow, so the random token in the URL is the only
// access control here. It shows the same shared calendar every logged-in member
// already sees inside the app (this app has no per-user data privacy boundaries
// elsewhere either), not a personal/filtered view.
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const user = await prisma.user.findUnique({
    where: { calendarFeedToken: params.token },
    select: { id: true },
  });
  if (!user) {
    return new NextResponse("Not found", { status: 404 });
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

  const events: IcsEvent[] = [
    ...tasks.map((t) => ({ id: `task-${t.id}`, title: `Task due: ${t.title}`, date: t.dueDate!.toISOString() })),
    ...milestones.map((m) => ({
      id: `milestone-${m.id}`,
      title: `Milestone: ${m.name}`,
      date: m.targetDate!.toISOString(),
    })),
    ...meetings.map((m) => ({
      id: `meeting-${m.id}`,
      title: `Meeting: ${m.title}`,
      date: m.scheduledAt!.toISOString(),
    })),
    ...marketing.map((m) => ({
      id: `marketing-${m.id}`,
      title: `Marketing: ${m.title}`,
      date: m.scheduledDate!.toISOString(),
    })),
  ];

  const ics = buildIcsFeed(events);

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="startup-os.ics"',
      "Cache-Control": "no-store",
    },
  });
}
