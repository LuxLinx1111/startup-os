import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();

  const files = await prisma.fileAsset.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    include: { folder: true, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(files);
}

// Files are stored as links (Drive/Dropbox/etc.) with metadata, since there's no
// object storage connected yet — see Files placeholder notes for the upgrade path.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const file = await prisma.fileAsset.create({
    data: {
      name: body.name,
      url: body.url,
      mimeType: body.mimeType || "link",
      sizeBytes: 0,
      category: body.category ?? "OTHER",
      folderId: body.folderId || null,
      uploadedById: session.user.id,
    },
    include: { folder: true, uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(file, { status: 201 });
}
