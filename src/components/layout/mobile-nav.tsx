"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { navItems, navGroups } from "@/lib/nav";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="left-0 top-0 h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 rounded-none border-r p-0 data-[state=open]:slide-in-from-left">
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Rocket className="h-4 w-4" />
            </div>
            <span className="font-semibold">Startup OS</span>
          </div>
          <nav className="h-[calc(100%-3.5rem)] space-y-4 overflow-y-auto px-3 py-4">
            {navGroups.map((group) => (
              <div key={group}>
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group}
                </p>
                <div className="space-y-0.5">
                  {navItems
                    .filter((item) => item.group === group)
                    .map((item) => {
                      const active = pathname?.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground",
                            active ? "bg-accent text-accent-foreground font-medium" : "text-foreground/80"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </span>
                          {item.phase === 2 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Soon
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                </div>
              </div>
            ))}
          </nav>
        </DialogContent>
      </Dialog>
    </>
  );
}
