import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const bug = await prisma.bug.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.severity !== undefined ? { severity: body.severity } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.stepsToReproduce !== undefined ? { stepsToReproduce: body.stepsToReproduce || null } : {}),
      ...(body.resolution !== undefined ? { resolution: body.resolution || null } : {}),
      ...(body.taskId !== undefined ? { taskId: body.taskId || null } : {}),
    },
    include: { task: { select: { id: true, title: true } } },
  });

  return NextResponse.json(bug);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.bug.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
