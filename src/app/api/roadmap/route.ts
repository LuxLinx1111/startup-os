import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.roadmapItem.findMany({ orderBy: [{ votes: "desc" }, { createdAt: "desc" }] });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.roadmapItem.create({
    data: {
      title: body.title,
      description: body.description || null,
      priority: body.priority ?? "MEDIUM",
      targetVersion: body.targetVersion || null,
      status: body.status ?? "IDEA",
      requestedBy: body.requestedBy || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
