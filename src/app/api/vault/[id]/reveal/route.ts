import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { logActivity } from "@/lib/server-utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const item = await prisma.vaultItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const value = decryptSecret(item.encryptedValue);

  await logActivity({
    actorId: session.user.id,
    entityType: "VaultItem",
    entityId: item.id,
    action: "revealed",
    summary: `${session.user.name} revealed vault item "${item.name}"`,
  });

  return NextResponse.json({ value });
}
