import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Wrench } from "lucide-react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/StateViews";
import { MechanicStatusBadge } from "@/components/StatusBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_MECHANIC_FILTER, useMechanics } from "@/hooks/useQueries";
import { formatNumber } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MechanicsPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useMechanics(
    DEFAULT_MECHANIC_FILTER,
  );

  const mechanics = data?.items ?? [];
  const total = data?.total ?? 0n;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">
            Mechanics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live roster with status, specialty, and workload.
          </p>
        </div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {isFetching ? "Syncing…" : `${formatNumber(total)} on roster`}
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load mechanics"
          description={error?.message ?? "Please try again."}
          onRetry={() => void refetch()}
        />
      ) : mechanics.length === 0 ? (
        <EmptyState
          title="No mechanics yet"
          description="When mechanics are added to the roster, they'll appear here with live status indicators."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mechanic</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead className="text-right">Jobs completed</TableHead>
                <TableHead className="text-right">Current booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mechanics.map((mechanic, index) => (
                <TableRow key={mechanic.id.toString()}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-primary/15 font-mono text-xs font-semibold text-primary">
                          {initials(mechanic.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          to="/mechanics/$id"
                          params={{ id: mechanic.id.toString() }}
                          data-ocid={`mechanics.row.${index}.link`}
                          className="font-medium text-foreground underline-offset-2 hover:underline"
                        >
                          {mechanic.name}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">
                          #{mechanic.id.toString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <MechanicStatusBadge status={mechanic.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {mechanic.specialty}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatNumber(mechanic.jobs_completed)}
                  </TableCell>
                  <TableCell className="text-right">
                    {mechanic.current_booking_id !== undefined ? (
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-primary"
                        data-ocid={`mechanics.row.${index}.booking_link`}
                      >
                        <Link
                          to="/bookings/$id"
                          params={{
                            id: mechanic.current_booking_id.toString(),
                          }}
                        >
                          #{mechanic.current_booking_id.toString()}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
