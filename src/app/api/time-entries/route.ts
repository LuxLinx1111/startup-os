import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeEntryCreateSchema } from "@/lib/validations";
import { getDefaultProject } from "@/lib/server-utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  const entries = await prisma.timeEntry.findMany({
    where: {
      ...(from || to
        ? {
            startedAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = timeEntryCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const project = await getDefaultProject();
  const { startedAt, endedAt, ...rest } = parsed.data;

  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : null;
  const durationMinutes =
    rest.durationMinutes ?? (end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0);

  const entry = await prisma.timeEntry.create({
    data: {
      ...rest,
      startedAt: start,
      endedAt: end,
      durationMinutes,
      userId: session.user.id,
      projectId: project.id,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
