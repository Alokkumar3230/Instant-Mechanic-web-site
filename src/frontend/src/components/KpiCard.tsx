import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  loading = false,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card data-ocid="kpi.card" className={cn("shadow-subtle", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            {label}
          </p>
          <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-4" />
          </span>
        </div>
        {loading ? (
          <Skeleton className="mt-3 h-8 w-24" />
        ) : (
          <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
        )}
        {hint && (
          <p className="mt-1 font-mono text-[11px] text-muted-foreground">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
