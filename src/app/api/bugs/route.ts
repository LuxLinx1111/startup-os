import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bugs = await prisma.bug.findMany({
    include: { task: { select: { id: true, title: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(bugs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const bug = await prisma.bug.create({
    data: {
      title: body.title,
      description: body.description || null,
      severity: body.severity ?? "MEDIUM",
      status: body.status ?? "OPEN",
      stepsToReproduce: body.stepsToReproduce || null,
      resolution: body.resolution || null,
      taskId: body.taskId || null,
    },
    include: { task: { select: { id: true, title: true } } },
  });

  return NextResponse.json(bug, { status: 201 });
}
