import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.checklistItem.update({
    where: { id: params.id },
    data: {
      ...(typeof body.isDone === "boolean" ? { isDone: body.isDone } : {}),
      ...(typeof body.label === "string" ? { label: body.label } : {}),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.checklistItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
