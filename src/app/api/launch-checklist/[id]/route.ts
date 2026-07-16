import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const item = await prisma.launchChecklistItem.update({
    where: { id: params.id },
    data: {
      ...(typeof body.isComplete === "boolean" ? { isComplete: body.isComplete } : {}),
      ...(typeof body.title === "string" ? { title: body.title } : {}),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.launchChecklistItem.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
