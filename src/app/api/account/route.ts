import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { accountUpdateSchema } from "@/lib/validations";
import { logActivity } from "@/lib/server-utils";

// GET the current logged-in user's own profile — deliberately scoped to "me"
// (session.user.id) rather than accepting an id param, so this can never be used
// to read someone else's account details.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      backupEmail: true,
      image: true,
      role: true,
      calendarFeedToken: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const googleAccount = await prisma.account.findFirst({
    where: { userId: user.id, provider: "google" },
    select: { id: true },
  });

  return NextResponse.json({ ...user, googleConnected: !!googleAccount });
}

// PATCH updates the current user's own profile fields. Primary email changes are
// allowed here without a separate verification step (see FEATURE_ASSESSMENT.md for
// the tradeoff) — but we do still guard against colliding with another account's email.
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = accountUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email, phone, backupEmail } = parsed.data;

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email: email.toLowerCase().trim() } : {}),
      ...(phone !== undefined ? { phone: phone || null } : {}),
      ...(backupEmail !== undefined
        ? { backupEmail: backupEmail ? backupEmail.toLowerCase().trim() : null }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      backupEmail: true,
      image: true,
      role: true,
    },
  });

  await logActivity({
    actorId: user.id,
    entityType: "user",
    entityId: user.id,
    action: "updated",
    summary: "Updated their profile",
  });

  return NextResponse.json(user);
}
