import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const milestone = await prisma.milestone.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.targetDate !== undefined
        ? { targetDate: body.targetDate ? new Date(body.targetDate) : null }
        : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.risks !== undefined ? { risks: body.risks || null } : {}),
      ...(body.dependencies !== undefined ? { dependencies: body.dependencies || null } : {}),
    },
    include: { tasks: { select: { id: true, status: true, title: true } } },
  });

  return NextResponse.json(milestone);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.milestone.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
