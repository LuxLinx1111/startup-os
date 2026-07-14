import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const risks = await prisma.risk.findMany({
    include: { owner: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(risks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const risk = await prisma.risk.create({
    data: {
      title: body.title,
      description: body.description || null,
      impact: body.impact ?? "MEDIUM",
      likelihood: body.likelihood ?? "MEDIUM",
      mitigationPlan: body.mitigationPlan || null,
      ownerId: body.ownerId || null,
      status: body.status ?? "OPEN",
    },
    include: { owner: { select: { name: true, image: true } } },
  });

  return NextResponse.json(risk, { status: 201 });
}
