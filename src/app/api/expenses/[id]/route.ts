import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const expense = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.amount !== undefined ? { amount: Number(body.amount) } : {}),
      ...(body.isRecurring !== undefined ? { isRecurring: Boolean(body.isRecurring) } : {}),
      ...(body.recurrenceInterval !== undefined
        ? { recurrenceInterval: body.recurrenceInterval || null }
        : {}),
      ...(body.date !== undefined ? { date: new Date(body.date) } : {}),
      ...(body.vendor !== undefined ? { vendor: body.vendor || null } : {}),
      ...(body.notes !== undefined ? { notes: body.notes || null } : {}),
    },
  });

  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
