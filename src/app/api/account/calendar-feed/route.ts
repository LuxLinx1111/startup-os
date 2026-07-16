import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// (Re)generates the secret token used in this user's Apple/iCloud (or any .ics-subscribing
// app) calendar feed URL. Calling this again invalidates the old link — useful if a feed
// URL is ever accidentally shared, since the URL itself is the only thing standing in for
// authentication on that endpoint.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = crypto.randomBytes(24).toString("hex");
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { calendarFeedToken: token },
    select: { calendarFeedToken: true },
  });

  return NextResponse.json(user);
}
