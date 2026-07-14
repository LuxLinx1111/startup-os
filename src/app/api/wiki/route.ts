import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { wikiPageCreateSchema } from "@/lib/validations";
import { slugify } from "@/lib/slug";
import { logActivity } from "@/lib/server-utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();

  const pages = await prisma.wikiPage.findMany({
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

  return NextResponse.json(pages);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = wikiPageCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let baseSlug = slugify(parsed.data.title) || "page";
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.wikiPage.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const page = await prisma.wikiPage.create({
    data: { ...parsed.data, slug, authorId: session.user.id },
    include: { author: { select: { name: true, image: true } } },
  });

  await logActivity({
    actorId: session.user.id,
    entityType: "WikiPage",
    entityId: page.id,
    action: "created",
    summary: `${session.user.name} created wiki page "${page.title}"`,
  });

  return NextResponse.json(page, { status: 201 });
}
