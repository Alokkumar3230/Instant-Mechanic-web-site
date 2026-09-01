import type { BookingStatus, MechanicStatus } from "@/backend";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BOOKING_STYLES: Record<BookingStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  assigned: "bg-accent/15 text-accent border-accent/30",
  on_the_way: "bg-accent/15 text-accent border-accent/30",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const BOOKING_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  on_the_way: "On the way",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const MECHANIC_STYLES: Record<MechanicStatus, string> = {
  available: "bg-success/15 text-success border-success/30",
  busy: "bg-primary/15 text-primary border-primary/30",
  offline: "bg-muted text-muted-foreground border-border",
};

const MECHANIC_LABELS: Record<MechanicStatus, string> = {
  available: "Available",
  busy: "Busy",
  offline: "Offline",
};

export function BookingStatusBadge({
  status,
  className,
}: {
  status: BookingStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      data-ocid="status.badge"
      className={cn("rounded-full", BOOKING_STYLES[status], className)}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {BOOKING_LABELS[status]}
    </Badge>
  );
}

export function MechanicStatusBadge({
  status,
  className,
}: {
  status: MechanicStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      data-ocid="status.badge"
      className={cn("rounded-full", MECHANIC_STYLES[status], className)}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {MECHANIC_LABELS[status]}
    </Badge>
  );
}
