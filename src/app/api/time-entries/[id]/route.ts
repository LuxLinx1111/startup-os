import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { timeEntryUpdateSchema } from "@/lib/validations";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = timeEntryUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startedAt, endedAt, ...rest } = parsed.data;

  let durationMinutes = rest.durationMinutes;
  if (startedAt && endedAt) {
    durationMinutes = Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 60000);
  }

  const entry = await prisma.timeEntry.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(startedAt ? { startedAt: new Date(startedAt) } : {}),
      ...(endedAt !== undefined ? { endedAt: endedAt ? new Date(endedAt) : null } : {}),
      ...(durationMinutes !== undefined ? { durationMinutes } : {}),
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
      task: { select: { id: true, title: true } },
      project: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.timeEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
