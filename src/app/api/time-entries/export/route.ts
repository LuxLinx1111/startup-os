import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.timeEntry.findMany({
    include: {
      user: { select: { name: true } },
      task: { select: { title: true } },
      project: { select: { name: true } },
    },
    orderBy: { startedAt: "desc" },
  });

  const header = ["Date", "Person", "Project", "Task", "Start", "End", "Hours", "Manual", "Notes"];
  const rows = entries.map((e) => [
    e.startedAt.toISOString().slice(0, 10),
    e.user.name,
    e.project?.name ?? "",
    e.task?.title ?? "",
    e.startedAt.toISOString(),
    e.endedAt ? e.endedAt.toISOString() : "",
    (e.durationMinutes / 60).toFixed(2),
    e.isManual ? "Yes" : "No",
    e.notes ?? "",
  ]);

  const csv = [header, ...rows].map((row) => row.map((v) => csvEscape(String(v))).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="time-entries-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
