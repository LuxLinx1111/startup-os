import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
  const ownerName = process.env.SEED_OWNER_NAME ?? "Payton";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "change-me-123";

  const cofounderEmail = process.env.SEED_COFOUNDER_EMAIL ?? "cofounder@example.com";
  const cofounderName = process.env.SEED_COFOUNDER_NAME ?? "Dad";
  const cofounderPassword = process.env.SEED_COFOUNDER_PASSWORD ?? "change-me-123";

  const owner = await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      name: ownerName,
      role: "OWNER",
      title: "Founder / Product & Engineering",
      passwordHash: await bcrypt.hash(ownerPassword, 10),
      skills: ["Product", "Engineering", "Design"],
      ownershipAreas: ["Product", "App development"],
      decisionAuthority: "Final say on product and technical decisions",
    },
  });

  const cofounder = await prisma.user.upsert({
    where: { email: cofounderEmail },
    update: {},
    create: {
      email: cofounderEmail,
      name: cofounderName,
      role: "OWNER",
      title: "Co-founder / Operations & Business",
      passwordHash: await bcrypt.hash(cofounderPassword, 10),
      skills: ["Operations", "Finance", "Business strategy"],
      ownershipAreas: ["Budget", "Legal", "Business development"],
      decisionAuthority: "Final say on financial and business decisions",
    },
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-default-project" },
    update: {},
    create: {
      id: "seed-default-project",
      name: "Our Startup",
      description: "Our mobile app startup — built and launched by the two of us.",
      status: "ACTIVE",
      startDate: new Date(),
      targetLaunchDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      budgetTotal: 15000,
    },
  });

  const iosTag = await prisma.tag.upsert({ where: { name: "ios" }, update: {}, create: { name: "ios" } });
  const marketingTag = await prisma.tag.upsert({
    where: { name: "marketing" },
    update: {},
    create: { name: "marketing" },
  });

  interface SampleTask {
    title: string;
    description: string;
    status: "DONE" | "IN_PROGRESS" | "TODO" | "BACKLOG";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    ownerId: string | null;
    dueDate: Date | null;
    estimatedHours: number;
    tagId?: string;
  }

  const sampleTasks: SampleTask[] = [
    {
      title: "Define MVP feature set",
      description: "Write down the smallest set of features that make this app worth using.",
      status: "DONE",
      priority: "HIGH",
      ownerId: owner.id,
      dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      estimatedHours: 4,
    },
    {
      title: "Set up app project skeleton",
      description: "Repo, CI, base navigation, and design system.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      ownerId: owner.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
      estimatedHours: 8,
      tagId: iosTag.id,
    },
    {
      title: "Draft launch landing page copy",
      description: "Value prop, feature highlights, waitlist CTA.",
      status: "TODO",
      priority: "MEDIUM",
      ownerId: cofounder.id,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
      estimatedHours: 3,
      tagId: marketingTag.id,
    },
    {
      title: "Research app store submission requirements",
      description: "Apple + Google guidelines, screenshots, privacy policy needs.",
      status: "BACKLOG",
      priority: "LOW",
      ownerId: null,
      dueDate: null,
      estimatedHours: 2,
    },
  ];

  for (const t of sampleTasks) {
    const { tagId, ...data } = t;
    const existing = await prisma.task.findFirst({ where: { title: data.title, projectId: project.id } });
    if (existing) continue;
    await prisma.task.create({
      data: {
        ...data,
        projectId: project.id,
        tags: tagId ? { create: [{ tagId }] } : undefined,
        checklist: {
          create: [
            { label: "Draft", order: 1, isDone: true },
            { label: "Review", order: 2, isDone: false },
          ],
        },
      },
    });
  }

  const firstTask = await prisma.task.findFirst({ where: { projectId: project.id } });
  if (firstTask) {
    const existingEntry = await prisma.timeEntry.findFirst({ where: { taskId: firstTask.id } });
    if (!existingEntry) {
      const start = new Date();
      start.setHours(9, 0, 0, 0);
      const end = new Date();
      end.setHours(11, 30, 0, 0);
      await prisma.timeEntry.create({
        data: {
          userId: owner.id,
          taskId: firstTask.id,
          projectId: project.id,
          startedAt: start,
          endedAt: end,
          durationMinutes: 150,
          isManual: true,
          notes: "Initial planning session",
        },
      });
    }
  }

  const existingWiki = await prisma.wikiPage.findUnique({ where: { slug: "welcome" } });
  if (!existingWiki) {
    await prisma.wikiPage.create({
      data: {
        title: "Welcome to the Wiki",
        slug: "welcome",
        category: "OTHER",
        isPinned: true,
        authorId: owner.id,
        content:
          "# Welcome\n\nThis is your company wiki. Use it for meeting notes, PRDs, business plans, technical docs, marketing strategy, branding, legal, SOPs, research, and competitor analysis.\n\nEdits autosave as you type, and every save keeps a version in history.",
      },
    });
  }

  console.log("Seed complete:");
  console.log(`  Owner:      ${owner.email}`);
  console.log(`  Co-founder: ${cofounder.email}`);
  console.log(`  Project:    ${project.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
