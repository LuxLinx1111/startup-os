import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decisions = await prisma.decision.findMany({
    include: { decidedBy: { select: { name: true, image: true } } },
    orderBy: { decidedAt: "desc" },
  });

  return NextResponse.json(decisions);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const decision = await prisma.decision.create({
    data: {
      title: body.title,
      context: body.context || null,
      decision: body.decision,
      rationale: body.rationale || null,
      outcome: body.outcome || null,
      status: body.status ?? "DECIDED",
      decidedById: session.user.id,
    },
    include: { decidedBy: { select: { name: true, image: true } } },
  });

  return NextResponse.json(decision, { status: 201 });
}
