import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const note = await prisma.note.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.isPinned !== undefined ? { isPinned: body.isPinned } : {}),
    },
    include: { author: { select: { name: true, image: true } } },
  });

  return NextResponse.json(note);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.note.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
