import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, label } = await req.json();
  if (!taskId || !label) return NextResponse.json({ error: "taskId and label required" }, { status: 400 });

  const maxOrder = await prisma.checklistItem.aggregate({ where: { taskId }, _max: { order: true } });

  const item = await prisma.checklistItem.create({
    data: { taskId, label, order: (maxOrder._max.order ?? 0) + 1 },
  });

  return NextResponse.json(item, { status: 201 });
}
