import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const meetings = await prisma.meeting.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(meetings);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const meeting = await prisma.meeting.create({
    data: {
      title: body.title,
      cadence: body.cadence || null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      notes: body.notes || null,
      actionItems: body.actionItems || null,
    },
  });

  return NextResponse.json(meeting, { status: 201 });
}
