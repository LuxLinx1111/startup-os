import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultProject, logActivity } from "@/lib/server-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  const expenses = await prisma.expense.findMany({
    where: { projectId: project.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  const body = await req.json();

  const expense = await prisma.expense.create({
    data: {
      projectId: project.id,
      category: body.category ?? "OTHER",
      name: body.name,
      amount: Number(body.amount),
      isRecurring: Boolean(body.isRecurring),
      recurrenceInterval: body.recurrenceInterval || null,
      date: new Date(body.date),
      vendor: body.vendor || null,
      notes: body.notes || null,
    },
  });

  await logActivity({
    actorId: session.user.id,
    entityType: "Expense",
    entityId: expense.id,
    action: "created",
    summary: `${session.user.name} logged expense "${expense.name}" ($${expense.amount})`,
  });

  return NextResponse.json(expense, { status: 201 });
}
