import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      ...(body.title !== undefined ? { title: body.title || null } : {}),
      ...(body.skills !== undefined ? { skills: body.skills } : {}),
      ...(body.ownershipAreas !== undefined ? { ownershipAreas: body.ownershipAreas } : {}),
      ...(body.decisionAuthority !== undefined
        ? { decisionAuthority: body.decisionAuthority || null }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      title: true,
      skills: true,
      ownershipAreas: true,
      decisionAuthority: true,
    },
  });

  return NextResponse.json(user);
}
