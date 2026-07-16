import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ChecklistSection } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_ITEMS: { section: ChecklistSection; title: string }[] = [
  { section: "DEV", title: "Core features complete" },
  { section: "DEV", title: "Crash reporting & analytics wired up" },
  { section: "DEV", title: "Push notifications configured" },
  { section: "QA", title: "Manual QA pass on real devices" },
  { section: "QA", title: "Beta tester feedback addressed" },
  { section: "LEGAL", title: "Privacy policy published" },
  { section: "LEGAL", title: "Terms of service published" },
  { section: "MARKETING", title: "Landing page live" },
  { section: "MARKETING", title: "Launch announcement drafted" },
  { section: "APP_STORE", title: "App Store listing (screenshots, copy, icon)" },
  { section: "APP_STORE", title: "Google Play listing (screenshots, copy, icon)" },
  { section: "APP_STORE", title: "App review guidelines checked" },
  { section: "ANALYTICS", title: "Key funnels instrumented" },
  { section: "SUPPORT", title: "Support email / contact form live" },
  { section: "SUPPORT", title: "FAQ / help docs published" },
  { section: "POST_LAUNCH", title: "Monitor crash reports first 48 hours" },
  { section: "POST_LAUNCH", title: "Respond to first reviews" },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.launchChecklistItem.findMany({ orderBy: [{ section: "asc" }, { order: "asc" }] });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (body.seedDefaults) {
    const existingCount = await prisma.launchChecklistItem.count();
    if (existingCount > 0) return NextResponse.json({ error: "Already has items" }, { status: 400 });
    await prisma.launchChecklistItem.createMany({
      data: DEFAULT_ITEMS.map((item, i) => ({ ...item, order: i })),
    });
    const items = await prisma.launchChecklistItem.findMany({ orderBy: [{ section: "asc" }, { order: "asc" }] });
    return NextResponse.json(items, { status: 201 });
  }

  const maxOrder = await prisma.launchChecklistItem.aggregate({
    where: { section: body.section },
    _max: { order: true },
  });

  const item = await prisma.launchChecklistItem.create({
    data: { section: body.section, title: body.title, order: (maxOrder._max.order ?? 0) + 1 },
  });

  return NextResponse.json(item, { status: 201 });
}
