import { WikiSidebar } from "@/components/wiki/wiki-sidebar";

export default function WikiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-3.5rem-2rem)] gap-4 md:h-[calc(100vh-3.5rem-3rem)]">
      <WikiSidebar />
      <div className="flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
  );
}
