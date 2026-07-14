import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { taskCreateSchema } from "@/lib/validations";
import { getDefaultProject, logActivity } from "@/lib/server-utils";
import { taskInclude } from "@/lib/task-include";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  const tasks = await prisma.task.findMany({
    where: { projectId: project.id, isTemplate: false },
    include: taskInclude,
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = taskCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await getDefaultProject();
  const { tagNames, ...data } = parsed.data;

  const maxOrder = await prisma.task.aggregate({
    where: { projectId: project.id, status: data.status ?? "TODO" },
    _max: { order: true },
  });

  const task = await prisma.task.create({
    data: {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId: project.id,
      order: (maxOrder._max.order ?? 0) + 1,
      tags: tagNames?.length
        ? {
            create: await Promise.all(
              tagNames.map(async (name) => {
                const tag = await prisma.tag.upsert({
                  where: { name },
                  update: {},
                  create: { name },
                });
                return { tagId: tag.id };
              })
            ),
          }
        : undefined,
    },
    include: taskInclude,
  });

  await logActivity({
    actorId: session.user.id,
    entityType: "Task",
    entityId: task.id,
    action: "created",
    summary: `${session.user.name} created task "${task.title}"`,
  });

  return NextResponse.json(task, { status: 201 });
}
