import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId, relatedTaskId, type } = await req.json();
  if (!taskId || !relatedTaskId) {
    return NextResponse.json({ error: "taskId and relatedTaskId required" }, { status: 400 });
  }

  const relation = await prisma.taskRelation.create({
    data: { taskId, relatedTaskId, type: type ?? "RELATED" },
  });

  return NextResponse.json(relation, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.taskRelation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
