import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wikiPageUpdateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/server-utils";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const page = await prisma.wikiPage.findUnique({
    where: { slug: params.slug },
    include: {
      author: { select: { name: true, image: true } },
      revisions: { orderBy: { createdAt: "desc" }, take: 10, include: { editedBy: { select: { name: true } } } },
    },
  });
  if (!page) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(page);
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.wikiPage.findUnique({ where: { slug: params.slug } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = wikiPageUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Snapshot the previous content as a revision before overwriting.
  if (parsed.data.content !== undefined && parsed.data.content !== existing.content) {
    await prisma.wikiRevision.create({
      data: { pageId: existing.id, content: existing.content, editedById: session.user.id },
    });
  }

  const page = await prisma.wikiPage.update({
    where: { slug: params.slug },
    data: parsed.data,
    include: { author: { select: { name: true, image: true } } },
  });

  await logActivity({
    actorId: session.user.id,
    entityType: "WikiPage",
    entityId: page.id,
    action: "updated",
    summary: `${session.user.name} edited wiki page "${page.title}"`,
  });

  return NextResponse.json(page);
}

export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.wikiPage.delete({ where: { slug: params.slug } });
  return NextResponse.json({ success: true });
}
