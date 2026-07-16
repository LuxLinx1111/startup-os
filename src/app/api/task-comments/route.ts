import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/server-utils";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, body } = await req.json();
  if (!taskId || !body) return NextResponse.json({ error: "taskId and body required" }, { status: 400 });

  const comment = await prisma.taskComment.create({
    data: { taskId, body, authorId: session.user.id },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { title: true } });
  await logActivity({
    actorId: session.user.id,
    entityType: "Task",
    entityId: taskId,
    action: "commented",
    summary: `${session.user.name} commented on "${task?.title}"`,
  });

  return NextResponse.json(comment, { status: 201 });
}
