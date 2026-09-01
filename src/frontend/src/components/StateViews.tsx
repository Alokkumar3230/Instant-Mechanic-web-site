import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <output
      data-ocid="loading_state"
      className={cn(
        "block space-y-3 rounded-md border border-border bg-card p-5 shadow-subtle",
        className,
      )}
      aria-label="Loading"
    >
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-24" />
    </output>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <output
      data-ocid="loading_state"
      className="block space-y-2"
      aria-label="Loading rows"
    >
      {Array.from({ length: rows }, (_, i) => i).map((row) => (
        <Skeleton key={`skeleton-row-${row}`} className="h-12 w-full" />
      ))}
    </output>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-ocid="empty_state"
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-border bg-card/40 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      data-ocid="error_state"
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 px-6 py-14 text-center",
        className,
      )}
      role="alert"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </span>
      <h3 className="mt-4 font-display text-base font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          data-ocid="retry_button"
          onClick={onRetry}
        >
          <RefreshCw />
          Retry
        </Button>
      )}
    </div>
  );
}
