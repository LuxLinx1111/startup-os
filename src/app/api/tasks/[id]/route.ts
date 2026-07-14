import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/server-utils";
import { taskInclude } from "@/lib/task-include";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id }, include: taskInclude });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = taskUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tagNames, dueDate, ...data } = parsed.data;

  if (tagNames) {
    await prisma.taskTag.deleteMany({ where: { taskId: params.id } });
    for (const name of tagNames) {
      const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
      await prisma.taskTag.create({ data: { taskId: params.id, tagId: tag.id } });
    }
  }

  const task = await prisma.task.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(dueDate !== undefined ? { dueDate: dueDate ? new Date(dueDate) : null } : {}),
    },
    include: taskInclude,
  });

  await logActivity({
    actorId: session.user.id,
    entityType: "Task",
    entityId: task.id,
    action: "updated",
    summary: `${session.user.name} updated task "${task.title}"`,
  });

  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.delete({ where: { id: params.id } });

  await logActivity({
    actorId: session.user.id,
    entityType: "Task",
    entityId: task.id,
    action: "deleted",
    summary: `${session.user.name} deleted task "${task.title}"`,
  });

  return NextResponse.json({ success: true });
}
