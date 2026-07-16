import { z } from "zod";

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("TODO"),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().min(0).optional().nullable(),
  tagNames: z.array(z.string()).optional(),
  isTemplate: z.boolean().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional().nullable(),
  milestoneId: z.string().optional().nullable(),
});

export const taskUpdateSchema = taskCreateSchema.partial().extend({
  order: z.number().optional(),
});

export const timeEntryCreateSchema = z.object({
  taskId: z.string().optional().nullable(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().optional().nullable(),
  durationMinutes: z.number().min(0).optional(),
  isManual: z.boolean().default(false),
  isRunning: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export const timeEntryUpdateSchema = timeEntryCreateSchema.partial();

export const wikiPageCreateSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional().default(""),
  category: z
    .enum([
      "MEETING_NOTES",
      "PRD",
      "BUSINESS_PLAN",
      "TECH_DOCS",
      "MARKETING",
      "BRANDING",
      "LEGAL",
      "SOP",
      "RESEARCH",
      "COMPETITOR",
      "OTHER",
    ])
    .default("OTHER"),
  tags: z.array(z.string()).optional(),
  parentId: z.string().optional().nullable(),
});

export const wikiPageUpdateSchema = wikiPageCreateSchema.partial().extend({
  isPinned: z.boolean().optional(),
});

// ---------- Account / profile ----------

const optionalEmail = z
  .string()
  .refine((v) => v === "" || z.string().email().safeParse(v).success, {
    message: "Enter a valid email address",
  })
  .optional()
  .nullable();

export const accountUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Enter a valid email address").optional(),
  phone: z.string().max(30, "Phone number looks too long").optional().nullable(),
  backupEmail: optionalEmail,
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters long")
    .max(200),
});
