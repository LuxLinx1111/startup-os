import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.roadmapItem.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.priority !== undefined ? { priority: body.priority } : {}),
      ...(body.targetVersion !== undefined ? { targetVersion: body.targetVersion || null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.requestedBy !== undefined ? { requestedBy: body.requestedBy || null } : {}),
      ...(body.votes !== undefined ? { votes: body.votes } : {}),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.roadmapItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
