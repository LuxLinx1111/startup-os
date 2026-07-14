import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDefaultProject } from "@/lib/server-utils";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const project = await getDefaultProject();
  const body = await req.json();

  const updated = await prisma.project.update({
    where: { id: project.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.targetLaunchDate !== undefined
        ? { targetLaunchDate: body.targetLaunchDate ? new Date(body.targetLaunchDate) : null }
        : {}),
      ...(body.budgetTotal !== undefined
        ? { budgetTotal: body.budgetTotal === null ? null : Number(body.budgetTotal) }
        : {}),
    },
  });

  return NextResponse.json(updated);
}
