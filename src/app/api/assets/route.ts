import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assets = await prisma.asset.findMany({
    include: { file: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(assets);
}

// Since there's no object storage connected yet, assets are stored as links
// (Google Drive, Dropbox, Figma, etc.) via a lightweight FileAsset record.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  let fileId: string | null = null;
  if (body.url) {
    const file = await prisma.fileAsset.create({
      data: {
        name: body.name,
        url: body.url,
        mimeType: "link",
        sizeBytes: 0,
        category: "OTHER",
        uploadedById: session.user.id,
      },
    });
    fileId = file.id;
  }

  const asset = await prisma.asset.create({
    data: {
      name: body.name,
      type: body.type ?? "GRAPHIC",
      tags: body.tags ?? [],
      fileId,
    },
    include: { file: true },
  });

  return NextResponse.json(asset, { status: 201 });
}
