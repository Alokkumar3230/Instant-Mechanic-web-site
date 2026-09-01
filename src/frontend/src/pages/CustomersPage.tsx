import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { EmptyState, ErrorState, TableSkeleton } from "@/components/StateViews";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEFAULT_CUSTOMER_FILTER, useCustomers } from "@/hooks/useQueries";
import { formatDate, formatNumber } from "@/lib/format";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useCustomers(
    {
      ...DEFAULT_CUSTOMER_FILTER,
      search: search.trim() || undefined,
    },
  );

  const customers = data?.items ?? [];
  const total = data?.total ?? 0n;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">
            Customers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search the directory by name, email, or phone.
          </p>
        </div>
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          {isFetching ? "Syncing…" : `${formatNumber(total)} customers`}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, email, or phone…"
          aria-label="Search customers"
          data-ocid="customers.search_input"
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <ErrorState
          title="Couldn't load customers"
          description={error?.message ?? "Please try again."}
          onRetry={() => void refetch()}
        />
      ) : customers.length === 0 ? (
        <EmptyState
          title={search ? "No matching customers" : "No customers yet"}
          description={
            search
              ? "Try a different name, email, or phone number."
              : "When customers book a service, they'll appear here."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-subtle">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Member since</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer, index) => (
                <TableRow key={customer.id.toString()}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-accent/15 font-mono text-xs font-semibold text-accent">
                          {initials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          to="/customers/$id"
                          params={{ id: customer.id.toString() }}
                          data-ocid={`customers.row.${index}.link`}
                          className="font-medium text-foreground underline-offset-2 hover:underline"
                        >
                          {customer.name}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground">
                          #{customer.id.toString()}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {customer.phone}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                    {formatDate(customer.created_at)}
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
