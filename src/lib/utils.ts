import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatHours(minutes: number): string {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((a.getTime() - b.getTime()) / msPerDay);
}

export const priorityColors: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  URGENT: "bg-red-500",
};

export const statusLabels: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
};

export const statusColumns = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as const;

export const wikiCategoryLabels: Record<string, string> = {
  MEETING_NOTES: "Meeting Notes",
  PRD: "Product Requirements",
  BUSINESS_PLAN: "Business Plan",
  TECH_DOCS: "Technical Docs",
  MARKETING: "Marketing Strategy",
  BRANDING: "Branding Guidelines",
  LEGAL: "Legal",
  SOP: "SOPs",
  RESEARCH: "Research",
  COMPETITOR: "Competitor Analysis",
  OTHER: "Other",
};

export const wikiCategories = Object.keys(wikiCategoryLabels);

export const milestoneStatusLabels: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  AT_RISK: "At risk",
  COMPLETE: "Complete",
};

export const noteTypeLabels: Record<string, string> = {
  NOTE: "Note",
  BRAINSTORM: "Brainstorm",
  IDEA: "Idea",
  WHITEBOARD: "Whiteboard",
};

export const bugSeverityColors: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-blue-500",
  HIGH: "bg-amber-500",
  CRITICAL: "bg-red-500",
};

export const bugStatusLabels: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  FIXED: "Fixed",
  WONT_FIX: "Won't Fix",
  CANNOT_REPRODUCE: "Can't Reproduce",
};

export const impactColors: Record<string, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-amber-500",
  HIGH: "bg-red-500",
};

export const checklistSectionLabels: Record<string, string> = {
  DEV: "Development",
  QA: "QA",
  LEGAL: "Legal",
  MARKETING: "Marketing",
  APP_STORE: "App Store",
  ANALYTICS: "Analytics",
  SUPPORT: "Customer Support",
  POST_LAUNCH: "Post-Launch",
};

export const checklistSections = Object.keys(checklistSectionLabels);

export const expenseCategoryLabels: Record<string, string> = {
  SOFTWARE: "Software",
  CONTRACTOR: "Contractor",
  MARKETING: "Marketing",
  EQUIPMENT: "Equipment",
  LEGAL: "Legal",
  OTHER: "Other",
};
