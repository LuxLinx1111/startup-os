import { type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Phase2PlaceholderProps {
  title: string;
  icon: LucideIcon;
  description: string;
  plannedFields: string[];
}

export function Phase2Placeholder({ title, icon: Icon, description, plannedFields }: Phase2PlaceholderProps) {
  return (
    <div>
      <PageHeader
        title={title}
        actions={
          <Badge variant="secondary" className="text-xs">
            Planned for Phase 2
          </Badge>
        }
      />
      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Already modeled in the database, ready for UI:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {plannedFields.map((f) => (
                <Badge key={f} variant="outline" className="text-xs font-normal">
                  {f}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
