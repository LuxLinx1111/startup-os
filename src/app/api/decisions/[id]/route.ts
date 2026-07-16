import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const decision = await prisma.decision.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.context !== undefined ? { context: body.context || null } : {}),
      ...(body.decision !== undefined ? { decision: body.decision } : {}),
      ...(body.rationale !== undefined ? { rationale: body.rationale || null } : {}),
      ...(body.outcome !== undefined ? { outcome: body.outcome || null } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
    },
    include: { decidedBy: { select: { name: true, image: true } } },
  });

  return NextResponse.json(decision);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.decision.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
