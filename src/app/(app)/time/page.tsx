"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TimerBar } from "@/components/time/timer-bar";
import { TimeEntryTable } from "@/components/time/time-entry-table";
import { TimeReports } from "@/components/time/time-reports";
import { ManualEntryDialog } from "@/components/time/manual-entry-dialog";
import { useTimeEntries } from "@/hooks/use-time-entries";

function TimePageInner() {
  const searchParams = useSearchParams();
  const { mutate } = useTimeEntries();
  const [manualOpen, setManualOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Time Tracking"
        description="Log hours by task, project, and person — then see where the time actually goes."
        actions={
          <>
            <Button variant="outline" onClick={() => setManualOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add manual entry
            </Button>
            <a href="/api/time-entries/export">
              <Button variant="outline">
                <Download className="mr-1.5 h-4 w-4" /> Export CSV
              </Button>
            </a>
          </>
        }
      />

      <div className="mb-4">
        <TimerBar autoStart={searchParams.get("start") === "1"} />
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Entries</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="entries">
          <TimeEntryTable />
        </TabsContent>
        <TabsContent value="reports">
          <TimeReports />
        </TabsContent>
      </Tabs>

      <ManualEntryDialog open={manualOpen} onOpenChange={setManualOpen} onSaved={() => mutate()} />
    </div>
  );
}

export default function TimePage() {
  return (
    <Suspense fallback={null}>
      <TimePageInner />
    </Suspense>
  );
}
