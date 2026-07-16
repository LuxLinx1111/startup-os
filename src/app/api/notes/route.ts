import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();

  const notes = await prisma.note.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { content: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { author: { select: { name: true, image: true } } },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const note = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content ?? "",
      type: body.type ?? "NOTE",
      tags: body.tags ?? [],
      authorId: session.user.id,
    },
    include: { author: { select: { name: true, image: true } } },
  });

  return NextResponse.json(note, { status: 201 });
}
