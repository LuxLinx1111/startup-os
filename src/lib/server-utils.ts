import { prisma } from "@/lib/prisma";

// This workspace is built around a single active project (your startup/app).
// If you ever need multiple projects, everything already models projectId —
// this helper just picks the first one so Phase 1 UIs don't need a project switcher yet.
export async function getDefaultProject() {
  let project = await prisma.project.findFirst({ orderBy: { createdAt: "asc" } });
  if (!project) {
    project = await prisma.project.create({
      data: { name: "Our Startup", status: "ACTIVE" },
    });
  }
  return project;
}

export async function logActivity(params: {
  actorId: string;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
}) {
  await prisma.activityLog.create({ data: params });
}
