import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultProject, logActivity } from "@/lib/server-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  const milestones = await prisma.milestone.findMany({
    where: { projectId: project.id },
    include: { tasks: { select: { id: true, status: true, title: true } } },
    orderBy: [{ order: "asc" }, { targetDate: "asc" }],
  });

  return NextResponse.json(milestones);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  const body = await req.json();

  const maxOrder = await prisma.milestone.aggregate({
    where: { projectId: project.id },
    _max: { order: true },
  });

  const milestone = await prisma.milestone.create({
    data: {
      projectId: project.id,
      name: body.name,
      description: body.description || null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      status: body.status ?? "NOT_STARTED",
      risks: body.risks || null,
      dependencies: body.dependencies || null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
    include: { tasks: { select: { id: true, status: true, title: true } } },
  });

  await logActivity({
    actorId: session.user.id,
    entityType: "Milestone",
    entityId: milestone.id,
    action: "created",
    summary: `${session.user.name} created milestone "${milestone.name}"`,
  });

  return NextResponse.json(milestone, { status: 201 });
}
