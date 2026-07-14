import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const folders = await prisma.folder.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(folders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const folder = await prisma.folder.create({
    data: { name: body.name, parentId: body.parentId || null },
  });

  return NextResponse.json(folder, { status: 201 });
}
