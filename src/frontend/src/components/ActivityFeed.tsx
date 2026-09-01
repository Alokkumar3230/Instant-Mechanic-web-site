import { Link } from "@tanstack/react-router";
import { Activity, ArrowRight } from "lucide-react";

import { EmptyState } from "@/components/StateViews";
import { BookingStatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookings, useCustomers } from "@/hooks/useQueries";
import { formatDateTime } from "@/lib/format";

const FEED_SIZE = 8;

export function ActivityFeed() {
  const bookings = useBookings();
  const customers = useCustomers();

  const loading = bookings.isLoading || customers.isLoading;
  const error = bookings.isError || customers.isError;

  const customerNames = new Map<bigint, string>();
  for (const customer of customers.data?.items ?? []) {
    customerNames.set(customer.id, customer.name);
  }

  const feed = (bookings.data?.items ?? []).slice(0, FEED_SIZE);

  return (
    <Card data-ocid="activity_feed" className="shadow-subtle">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="size-4 text-primary" />
          Recent activity
        </CardTitle>
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
          Live
        </span>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div
            className="space-y-3 p-5"
            data-ocid="loading_state"
            aria-label="Loading activity"
          >
            {Array.from({ length: 5 }, (_, i) => i).map((row) => (
              <div
                key={`feed-skeleton-${row}`}
                className="flex items-center gap-3"
              >
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-5">
            <EmptyState
              title="Couldn't load activity"
              description="We couldn't fetch the latest booking activity. It will retry automatically."
            />
          </div>
        ) : feed.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="No activity yet"
              description="Booking status changes will appear here as they happen."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {feed.map((booking, index) => {
              const customerName =
                customerNames.get(booking.customer_id) ?? "Customer";
              return (
                <li key={booking.id.toString()}>
                  <Link
                    to="/bookings/$id"
                    params={{ id: booking.id.toString() }}
                    data-ocid={`activity.item.${index + 1}`}
                    className="group flex items-center gap-3 px-5 py-3 transition-smooth hover:bg-muted/40"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <ArrowRight className="size-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        <span className="font-mono text-xs text-muted-foreground">
                          #{booking.id.toString()}
                        </span>{" "}
                        {customerName}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                        {booking.service_category} · {booking.vehicle_make}{" "}
                        {booking.vehicle_model}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <BookingStatusBadge status={booking.status} />
                      <time className="font-mono text-[10px] text-muted-foreground">
                        {formatDateTime(booking.updated_at)}
                      </time>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
