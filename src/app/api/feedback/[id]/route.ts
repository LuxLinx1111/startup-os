import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.feedbackItem.update({
    where: { id: params.id },
    data: {
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.linkedRoadmapItemId !== undefined
        ? { linkedRoadmapItemId: body.linkedRoadmapItemId || null }
        : {}),
      ...(body.linkedBugId !== undefined ? { linkedBugId: body.linkedBugId || null } : {}),
    },
    include: {
      linkedRoadmapItem: { select: { id: true, title: true } },
      linkedBug: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.feedbackItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
