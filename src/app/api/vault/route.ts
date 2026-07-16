import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.vaultItem.findMany({
    include: { owner: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  // Never return decrypted values from the list endpoint — only a masked hint.
  // The full value is only decrypted via GET /api/vault/[id]/reveal, on demand.
  const masked = items.map((item) => {
    let hint = "••••";
    try {
      hint = maskSecret(decryptSecret(item.encryptedValue));
    } catch {
      hint = "••••";
    }
    return { ...item, encryptedValue: undefined, hint };
  });

  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.value) return NextResponse.json({ error: "value is required" }, { status: 400 });

  const item = await prisma.vaultItem.create({
    data: {
      name: body.name,
      category: body.category ?? "API_KEY",
      encryptedValue: encryptSecret(body.value),
      notes: body.notes || null,
      lastRotatedAt: new Date(),
      ownerId: session.user.id,
    },
  });

  return NextResponse.json({ ...item, encryptedValue: undefined }, { status: 201 });
}
