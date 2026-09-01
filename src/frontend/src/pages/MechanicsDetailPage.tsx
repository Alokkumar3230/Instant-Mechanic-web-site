import { Link, useParams } from "@tanstack/react-router";
import { ArrowUpRight, CalendarClock, Wrench } from "lucide-react";

import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/StateViews";
import {
  BookingStatusBadge,
  MechanicStatusBadge,
} from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DEFAULT_BOOKING_FILTER,
  useBookings,
  useMechanic,
} from "@/hooks/useQueries";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stat({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tracking-tight ${
          mono ? "font-mono tabular-nums" : "font-display"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function MechanicsDetailPage() {
  const { id } = useParams({ from: "/mechanics/$id" });
  const mechanicId = BigInt(id);

  const mechanicQuery = useMechanic(mechanicId);
  const bookingsQuery = useBookings({
    ...DEFAULT_BOOKING_FILTER,
    mechanic_id: mechanicId,
  });

  const mechanic = mechanicQuery.data;
  const bookings = bookingsQuery.data?.items ?? [];

  if (mechanicQuery.isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (mechanicQuery.isError || !mechanic) {
    return (
      <ErrorState
        title="Couldn't load this mechanic"
        description={
          mechanicQuery.error?.message ??
          "This mechanic may have been removed from the roster."
        }
        onRetry={() => void mechanicQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-primary/15 font-mono text-lg font-semibold text-primary">
              {initials(mechanic.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight">
              {mechanic.name}
            </h1>
            <p className="mt-0.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
              #{mechanic.id.toString()} · {mechanic.specialty}
            </p>
          </div>
        </div>
        <MechanicStatusBadge status={mechanic.status} className="self-start" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Status" value={mechanic.status} mono />
        <Stat label="Specialty" value={mechanic.specialty} />
        <Stat
          label="Jobs completed"
          value={formatNumber(mechanic.jobs_completed)}
          mono
        />
        <Stat label="Member since" value={formatDate(mechanic.created_at)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Recent bookings
          </CardTitle>
          <CardDescription>
            Latest jobs assigned to this mechanic.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookingsQuery.isLoading ? (
            <TableSkeleton rows={4} />
          ) : bookingsQuery.isError ? (
            <ErrorState
              title="Couldn't load booking history"
              description={bookingsQuery.error?.message ?? "Please try again."}
              onRetry={() => void bookingsQuery.refetch()}
            />
          ) : bookings.length === 0 ? (
            <EmptyState
              title="No bookings yet"
              description="Jobs assigned to this mechanic will show up here."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking, index) => (
                  <TableRow key={booking.id.toString()}>
                    <TableCell>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="gap-1 px-0 font-mono text-primary"
                        data-ocid={`mechanic.bookings.row.${index}.link`}
                      >
                        <Link
                          to="/bookings/$id"
                          params={{ id: booking.id.toString() }}
                        >
                          #{booking.id.toString()}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell className="max-w-56 truncate text-muted-foreground">
                      {booking.service_description}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.vehicle_make} {booking.vehicle_model}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(booking.scheduled_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
