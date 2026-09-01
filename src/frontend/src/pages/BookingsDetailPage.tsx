import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Car,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Wrench,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { BookingStatus } from "@/backend";
import { CardSkeleton, EmptyState, ErrorState } from "@/components/StateViews";
import { BookingStatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useBooking,
  useCustomer,
  useMechanic,
  useUpdateBookingStatus,
} from "@/hooks/useQueries";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  on_the_way: "On the way",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Ordered lifecycle used to render the status timeline. */
const LIFECYCLE: Array<BookingStatus> = [
  BookingStatus.pending,
  BookingStatus.assigned,
  BookingStatus.on_the_way,
  BookingStatus.in_progress,
  BookingStatus.completed,
];

const NEXT_STATUS: Partial<Record<BookingStatus, BookingStatus>> = {
  [BookingStatus.pending]: BookingStatus.assigned,
  [BookingStatus.assigned]: BookingStatus.on_the_way,
  [BookingStatus.on_the_way]: BookingStatus.in_progress,
  [BookingStatus.in_progress]: BookingStatus.completed,
};

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-medium",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export default function BookingsDetailPage() {
  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const id = params.id ? BigInt(params.id) : 0n;

  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: booking, isLoading, isError, refetch } = useBooking(id);
  const { data: customer } = useCustomer(booking?.customer_id ?? 0n);
  const { data: mechanic } = useMechanic(booking?.mechanic_id ?? 0n);
  const updateStatus = useUpdateBookingStatus();

  const nextStatus = booking ? NEXT_STATUS[booking.status] : undefined;
  const isTerminal =
    booking?.status === BookingStatus.completed ||
    booking?.status === BookingStatus.cancelled;

  const timeline = useMemo(() => {
    if (!booking) return [];
    if (booking.status === BookingStatus.cancelled) {
      return [
        { status: BookingStatus.pending, reached: true },
        { status: BookingStatus.cancelled, reached: true },
      ];
    }
    const currentIndex = LIFECYCLE.indexOf(booking.status);
    return LIFECYCLE.map((status, i) => ({
      status,
      reached: i <= currentIndex,
    }));
  }, [booking]);

  function handleAdvance() {
    if (!booking || !nextStatus) return;
    updateStatus.mutate(
      { id: booking.id, status: nextStatus },
      {
        onSuccess: (updated) => {
          setConfirmOpen(false);
          if (updated) {
            toast("Status updated", {
              description: `Booking #${booking.id} is now ${STATUS_LABELS[nextStatus].toLowerCase()}.`,
            });
          }
        },
        onError: () => {
          setConfirmOpen(false);
          toast.error("Could not update status", {
            description: "Please try again.",
          });
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <CardSkeleton className="h-40" />
        <CardSkeleton className="h-64" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  if (!booking) {
    return (
      <EmptyState
        title="Booking not found"
        description="This booking may have been removed or the ID is invalid."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/bookings" })}
            data-ocid="booking.back"
          >
            <ArrowLeft />
            Back to bookings
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/bookings" })}
            data-ocid="booking.back"
            aria-label="Back to bookings"
          >
            <ArrowLeft />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-xl font-bold tracking-tight">
                Booking #{booking.id.toString()}
              </h1>
              <BookingStatusBadge status={booking.status} />
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {customer?.name ?? `Customer #${booking.customer_id.toString()}`}
            </p>
          </div>
        </div>
        {!isTerminal && nextStatus && (
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={updateStatus.isPending}
            data-ocid="booking.advance_status"
          >
            Advance to {STATUS_LABELS[nextStatus]}
            <ArrowRight />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="size-4 text-primary" />
                Service details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <DetailRow
                  label="Service"
                  value={booking.service_description}
                />
                <DetailRow label="Category" value={booking.service_category} />
                <DetailRow
                  label="Vehicle"
                  value={`${booking.vehicle_make} ${booking.vehicle_model}`}
                />
                <DetailRow
                  label="Amount"
                  value={formatCurrency(booking.amount)}
                  mono
                />
                <DetailRow
                  label="Scheduled"
                  value={formatDateTime(booking.scheduled_at)}
                  mono
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer ? (
                <dl className="divide-y divide-border">
                  <DetailRow label="Name" value={customer.name} />
                  <DetailRow label="Email" value={customer.email} />
                  <DetailRow label="Phone" value={customer.phone} />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Customer #{booking.customer_id.toString()}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="size-4 text-primary" />
                Mechanic
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mechanic ? (
                <dl className="divide-y divide-border">
                  <DetailRow label="Name" value={mechanic.name} />
                  <DetailRow label="Specialty" value={mechanic.specialty} />
                  <DetailRow
                    label="Jobs completed"
                    value={mechanic.jobs_completed.toString()}
                    mono
                  />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {booking.mechanic_id === undefined
                    ? "No mechanic assigned yet."
                    : `Mechanic #${booking.mechanic_id.toString()}`}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                Timestamps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border">
                <DetailRow
                  label="Created"
                  value={formatDateTime(booking.created_at)}
                  mono
                />
                <DetailRow
                  label="Last updated"
                  value={formatDateTime(booking.updated_at)}
                  mono
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                Status history
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-border pl-5">
                {timeline.map((step) => (
                  <li key={step.status} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[26px] top-0.5 flex size-4 items-center justify-center rounded-full border",
                        step.reached
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {step.reached ? (
                        <CheckCircle2 className="size-3" />
                      ) : (
                        <Circle className="size-3" />
                      )}
                    </span>
                    <p
                      className={cn(
                        "text-sm font-medium",
                        step.reached
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {STATUS_LABELS[step.status]}
                    </p>
                    {step.status === booking.status && (
                      <Badge
                        variant="outline"
                        className="mt-1 rounded-full bg-primary/10 text-primary"
                      >
                        Current
                      </Badge>
                    )}
                  </li>
                ))}
              </ol>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground">
                Last updated {formatDateTime(booking.updated_at)}.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Advance booking #{booking.id.toString()}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will move the booking from{" "}
              <span className="font-medium text-foreground">
                {STATUS_LABELS[booking.status]}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {nextStatus ? STATUS_LABELS[nextStatus] : ""}
              </span>
              . The change propagates live to all connected clients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="booking.advance_cancel">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdvance}
              disabled={updateStatus.isPending}
              data-ocid="booking.advance_confirm"
            >
              {updateStatus.isPending ? "Updating…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
