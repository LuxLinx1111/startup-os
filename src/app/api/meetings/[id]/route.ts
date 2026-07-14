import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const meeting = await prisma.meeting.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.cadence !== undefined ? { cadence: body.cadence || null } : {}),
      ...(body.scheduledAt !== undefined
        ? { scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null }
        : {}),
      ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
      ...(body.actionItems !== undefined ? { actionItems: body.actionItems || null } : {}),
    },
  });

  return NextResponse.json(meeting);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.meeting.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
