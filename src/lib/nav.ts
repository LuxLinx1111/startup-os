import {
  LayoutDashboard,
  ListChecks,
  Timer,
  BookOpen,
  Wallet,
  Flag,
  Calendar,
  Users,
  StickyNote,
  FolderOpen,
  BarChart3,
  Map,
  Bug,
  ScrollText,
  MessageSquare,
  Megaphone,
  Image,
  KeyRound,
  ClipboardCheck,
  Video,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  phase: 1 | 2;
  group: "Workspace" | "Build" | "Grow" | "Company";
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, phase: 1, group: "Workspace" },
  { label: "Tasks", href: "/tasks", icon: ListChecks, phase: 1, group: "Workspace" },
  { label: "Time Tracking", href: "/time", icon: Timer, phase: 1, group: "Workspace" },
  { label: "Wiki", href: "/wiki", icon: BookOpen, phase: 1, group: "Workspace" },
  { label: "Calendar", href: "/calendar", icon: Calendar, phase: 1, group: "Workspace" },
  { label: "Notes", href: "/notes", icon: StickyNote, phase: 1, group: "Workspace" },
  { label: "Files", href: "/files", icon: FolderOpen, phase: 1, group: "Workspace" },

  { label: "Milestones", href: "/milestones", icon: Flag, phase: 1, group: "Build" },
  { label: "Roadmap", href: "/roadmap", icon: Map, phase: 1, group: "Build" },
  { label: "Bug Tracker", href: "/bugs", icon: Bug, phase: 1, group: "Build" },
  { label: "Launch Checklist", href: "/launch-checklist", icon: ClipboardCheck, phase: 1, group: "Build" },
  { label: "Decision Log", href: "/decisions", icon: ScrollText, phase: 1, group: "Build" },
  { label: "Risk Register", href: "/risks", icon: ShieldAlert, phase: 1, group: "Build" },

  { label: "Marketing Planner", href: "/marketing", icon: Megaphone, phase: 1, group: "Grow" },
  { label: "Customer Feedback", href: "/feedback", icon: MessageSquare, phase: 1, group: "Grow" },
  { label: "Asset Library", href: "/assets", icon: Image, phase: 1, group: "Grow" },
  { label: "Reports & Analytics", href: "/reports", icon: BarChart3, phase: 1, group: "Grow" },

  { label: "Budget & Expenses", href: "/budget", icon: Wallet, phase: 1, group: "Company" },
  { label: "Org & Team", href: "/org", icon: Users, phase: 1, group: "Company" },
  { label: "Meeting Hub", href: "/meetings", icon: Video, phase: 1, group: "Company" },
  { label: "Password Vault", href: "/vault", icon: KeyRound, phase: 1, group: "Company" },
];

export const navGroups = ["Workspace", "Build", "Grow", "Company"] as const;
