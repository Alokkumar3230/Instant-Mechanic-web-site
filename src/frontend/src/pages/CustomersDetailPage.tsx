import { Link, useParams } from "@tanstack/react-router";
import { ArrowUpRight, CalendarClock, Mail, Phone } from "lucide-react";

import {
  CardSkeleton,
  EmptyState,
  ErrorState,
  TableSkeleton,
} from "@/components/StateViews";
import { BookingStatusBadge } from "@/components/StatusBadge";
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
  useCustomer,
} from "@/hooks/useQueries";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomersDetailPage() {
  const { id } = useParams({ from: "/customers/$id" });
  const customerId = BigInt(id);

  const customerQuery = useCustomer(customerId);
  const bookingsQuery = useBookings({
    ...DEFAULT_BOOKING_FILTER,
    customer_id: customerId,
  });

  const customer = customerQuery.data;
  const bookings = bookingsQuery.data?.items ?? [];

  if (customerQuery.isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (customerQuery.isError || !customer) {
    return (
      <ErrorState
        title="Couldn't load this customer"
        description={
          customerQuery.error?.message ??
          "This customer may have been removed from the directory."
        }
        onRetry={() => void customerQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback className="bg-accent/15 font-mono text-lg font-semibold text-accent">
              {initials(customer.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="font-display text-xl font-bold tracking-tight">
              {customer.name}
            </h1>
            <p className="mt-0.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
              #{customer.id.toString()} · Member since{" "}
              {formatDate(customer.created_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="truncate font-medium">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-subtle">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Phone className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Phone</p>
            <p className="truncate font-mono font-medium">{customer.phone}</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Booking history
          </CardTitle>
          <CardDescription>
            Every service this customer has booked.
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
              description="When this customer books a service, it will show up here."
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
                  <TableHead className="text-right">Amount</TableHead>
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
                        data-ocid={`customer.bookings.row.${index}.link`}
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
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatCurrency(booking.amount)}
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
