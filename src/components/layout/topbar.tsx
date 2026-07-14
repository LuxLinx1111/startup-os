"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette } from "@/components/layout/command-palette";
import { QuickAddMenu } from "@/components/layout/quick-add-menu";
import { initials } from "@/lib/utils";

export function Topbar() {
  const { data: session } = useSession();
  const [paletteHint, setPaletteHint] = useState(false);

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <MobileNav />

      <button
        className="flex flex-1 items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted max-w-md"
        onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
        onMouseEnter={() => setPaletteHint(true)}
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search everything...</span>
        <kbd className="hidden rounded border bg-background px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <QuickAddMenu />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={session?.user?.image ?? undefined} />
                <AvatarFallback>{initials(session?.user?.name || "U")}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{session?.user?.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => (window.location.href = "/settings")}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CommandPalette />
    </header>
  );
}
