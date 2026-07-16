import { Prisma } from "@prisma/client";

export const taskInclude = Prisma.validator<Prisma.TaskInclude>()({
  owner: { select: { id: true, name: true, image: true } },
  tags: { include: { tag: true } },
  checklist: { orderBy: { order: "asc" } },
  comments: {
    include: { author: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "asc" },
  },
  attachments: { include: { file: true } },
  relationsFrom: { include: { relatedTask: { select: { id: true, title: true, status: true } } } },
  relationsTo: { include: { task: { select: { id: true, title: true, status: true } } } },
  timeEntries: { select: { durationMinutes: true } },
  milestone: { select: { id: true, name: true } },
});

export type TaskWithRelations = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;
