import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Global search across Phase 1 modules (Tasks, Wiki, Time Entries).
// Phase 2 modules (Expenses, Files, Milestones, Team) can be added here
// with the same pattern once their tables have data.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ tasks: [], wikiPages: [], timeEntries: [] });
  }

  const [tasks, wikiPages, timeEntries] = await Promise.all([
    prisma.task.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      take: 6,
      select: { id: true, title: true, status: true },
    }),
    prisma.wikiPage.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { id: true, title: true, slug: true },
    }),
    prisma.timeEntry.findMany({
      where: { notes: { contains: q, mode: "insensitive" } },
      take: 6,
      select: { id: true, notes: true, durationMinutes: true },
    }),
  ]);

  return NextResponse.json({ tasks, wikiPages, timeEntries });
}
