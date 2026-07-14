"use client";

import { useRouter } from "next/navigation";
import { Plus, ListChecks, Timer, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function QuickAddMenu() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick add</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Create</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/tasks?new=1")}>
          <ListChecks className="mr-2 h-4 w-4" /> New task
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/time?start=1")}>
          <Timer className="mr-2 h-4 w-4" /> Start timer
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/wiki?new=1")}>
          <BookOpen className="mr-2 h-4 w-4" /> New wiki page
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
