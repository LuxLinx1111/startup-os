import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.marketingItem.findMany({ orderBy: { scheduledDate: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.marketingItem.create({
    data: {
      type: body.type ?? "SOCIAL_POST",
      title: body.title,
      channel: body.channel || null,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      status: body.status ?? "IDEA",
      content: body.content || null,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
