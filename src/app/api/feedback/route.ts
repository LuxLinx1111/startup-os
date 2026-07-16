import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.feedbackItem.findMany({
    include: {
      linkedRoadmapItem: { select: { id: true, title: true } },
      linkedBug: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.feedbackItem.create({
    data: {
      source: body.source || null,
      customerName: body.customerName || null,
      content: body.content,
      type: body.type ?? "FEATURE_REQUEST",
      status: body.status ?? "NEW",
      linkedRoadmapItemId: body.linkedRoadmapItemId || null,
      linkedBugId: body.linkedBugId || null,
    },
    include: {
      linkedRoadmapItem: { select: { id: true, title: true } },
      linkedBug: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(item, { status: 201 });
}
