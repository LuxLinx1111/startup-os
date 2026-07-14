import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const risk = await prisma.risk.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description || null } : {}),
      ...(body.impact !== undefined ? { impact: body.impact } : {}),
      ...(body.likelihood !== undefined ? { likelihood: body.likelihood } : {}),
      ...(body.mitigationPlan !== undefined ? { mitigationPlan: body.mitigationPlan || null } : {}),
      ...(body.ownerId !== undefined ? { ownerId: body.ownerId || null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    include: { owner: { select: { name: true, image: true } } },
  });

  return NextResponse.json(risk);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.risk.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
