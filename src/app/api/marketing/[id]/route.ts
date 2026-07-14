import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.marketingItem.update({
    where: { id: params.id },
    data: {
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.channel !== undefined ? { channel: body.channel || null } : {}),
      ...(body.scheduledDate !== undefined
        ? { scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.content !== undefined ? { content: body.content || null } : {}),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.marketingItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
