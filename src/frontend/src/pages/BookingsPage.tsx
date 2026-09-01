import { useNavigate } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { BookingStatus } from "@/backend";
import type { BookingFilter, Mechanic } from "@/backend";
import { EmptyState, ErrorState, TableSkeleton } from "@/components/StateViews";
import { BookingStatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useBookings,
  useCustomers,
  useMechanics,
  useServiceCategories,
} from "@/hooks/useQueries";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";

const PAGE_SIZES = [10, 25, 50, 100] as const;

type SortKey = "id" | "amount" | "scheduled_at";

const STATUS_OPTIONS: Array<{ value: BookingStatus; label: string }> = [
  { value: BookingStatus.pending, label: "Pending" },
  { value: BookingStatus.assigned, label: "Assigned" },
  { value: BookingStatus.on_the_way, label: "On the way" },
  { value: BookingStatus.in_progress, label: "In progress" },
  { value: BookingStatus.completed, label: "Completed" },
  { value: BookingStatus.cancelled, label: "Cancelled" },
];

/** Convert an HTML date input value (YYYY-MM-DD) to a nanosecond timestamp. */
function dateFromToTimestamp(dateStr: string, startOfDay: boolean): bigint {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(
    y,
    m - 1,
    d,
    startOfDay ? 0 : 23,
    startOfDay ? 0 : 59,
    startOfDay ? 0 : 59,
  );
  return BigInt(date.getTime()) * 1_000_000n;
}

function mechanicName(
  id: bigint | undefined,
  mechanics?: Array<Mechanic>,
): string {
  if (id === undefined) return "Unassigned";
  const m = mechanics?.find((x) => x.id === id);
  return m ? m.name : `Mechanic #${id.toString()}`;
}

export default function BookingsPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [category, setCategory] = useState<string>("all");
  const [mechanicId, setMechanicId] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0n);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<SortKey>("scheduled_at");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filter = useMemo<BookingFilter>(() => {
    const f: BookingFilter = {
      page,
      limit: BigInt(pageSize),
      sort_by: sortBy,
      sort_desc: sortDesc,
    };
    if (debouncedSearch.trim()) f.search = debouncedSearch.trim();
    if (status !== "all") f.status = status;
    if (category !== "all") f.service_category = category;
    if (mechanicId !== "all") f.mechanic_id = BigInt(mechanicId);
    if (dateFrom) f.date_from = dateFromToTimestamp(dateFrom, true);
    if (dateTo) f.date_to = dateFromToTimestamp(dateTo, false);
    return f;
  }, [
    page,
    pageSize,
    sortBy,
    sortDesc,
    debouncedSearch,
    status,
    category,
    mechanicId,
    dateFrom,
    dateTo,
  ]);

  const { data, isLoading, isError, refetch } = useBookings(filter);
  const { data: categories } = useServiceCategories();
  const { data: mechanics } = useMechanics();
  const { data: customers } = useCustomers();

  const customerNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers?.items ?? []) map.set(c.id.toString(), c.name);
    return map;
  }, [customers]);

  const total = data?.total ?? 0n;
  const totalPages =
    pageSize === 0
      ? 1
      : Number((total + BigInt(pageSize) - 1n) / BigInt(pageSize));
  const currentPage = Number(page);

  const hasFilters =
    debouncedSearch.trim() !== "" ||
    status !== "all" ||
    category !== "all" ||
    mechanicId !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  function resetFilters() {
    setSearch("");
    setDebouncedSearch("");
    setStatus("all");
    setCategory("all");
    setMechanicId("all");
    setDateFrom("");
    setDateTo("");
    setPage(0n);
  }

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDesc((d) => !d);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
    setPage(0n);
  }

  function SortHeader({ label, sortKey }: { label: string; sortKey: SortKey }) {
    const active = sortBy === sortKey;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        data-ocid={`bookings.sort.${sortKey}`}
        className="inline-flex items-center gap-1.5 font-medium hover:text-foreground"
      >
        {label}
        {active ? (
          sortDesc ? (
            <ArrowDown className="size-3.5" />
          ) : (
            <ArrowUp className="size-3.5" />
          )
        ) : (
          <ArrowUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight">
            Bookings
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isLoading
              ? "Loading bookings…"
              : `${formatNumber(total)} total bookings`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Live · 5s poll
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-subtle">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0n);
              }}
              placeholder="Search customer or booking ID…"
              data-ocid="bookings.search_input"
              className="pl-9"
            />
          </div>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as BookingStatus | "all");
              setPage(0n);
            }}
          >
            <SelectTrigger
              data-ocid="bookings.filter.status"
              className="w-full"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => {
              setCategory(v);
              setPage(0n);
            }}
          >
            <SelectTrigger
              data-ocid="bookings.filter.category"
              className="w-full"
            >
              <SelectValue placeholder="Service category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories ?? []).map((c) => (
                <SelectItem key={c.id.toString()} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={mechanicId}
            onValueChange={(v) => {
              setMechanicId(v);
              setPage(0n);
            }}
          >
            <SelectTrigger
              data-ocid="bookings.filter.mechanic"
              className="w-full"
            >
              <SelectValue placeholder="Mechanic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All mechanics</SelectItem>
              {(mechanics?.items ?? []).map((m) => (
                <SelectItem key={m.id.toString()} value={m.id.toString()}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="date-from"
              className="text-xs text-muted-foreground"
            >
              From
            </label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0n);
              }}
              data-ocid="bookings.filter.date_from"
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-to" className="text-xs text-muted-foreground">
              To
            </label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0n);
              }}
              data-ocid="bookings.filter.date_to"
              className="w-40"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              data-ocid="bookings.reset_filters"
              className="ml-auto"
            >
              <X />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-subtle">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={8} />
          </div>
        ) : isError ? (
          <div className="p-4">
            <ErrorState onRetry={() => refetch()} />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title={
                hasFilters
                  ? "No bookings match your filters"
                  : "No bookings yet"
              }
              description={
                hasFilters
                  ? "Try adjusting or clearing your filters to see more results."
                  : "Bookings will appear here once customers place service requests."
              }
              action={
                hasFilters ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    data-ocid="bookings.empty_clear"
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortHeader label="Booking ID" sortKey="id" />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Mechanic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">
                      <SortHeader label="Amount" sortKey="amount" />
                    </TableHead>
                    <TableHead>
                      <SortHeader label="Date/Time" sortKey="scheduled_at" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((booking, idx) => (
                    <TableRow
                      key={booking.id.toString()}
                      data-ocid={`bookings.row.${idx}`}
                      onClick={() =>
                        navigate({
                          to: "/bookings/$id",
                          params: { id: booking.id.toString() },
                        })
                      }
                      className="cursor-pointer"
                    >
                      <TableCell className="font-mono text-xs font-semibold text-primary">
                        #{booking.id.toString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {customerNames.get(booking.customer_id.toString()) ??
                          `Customer #${booking.customer_id.toString()}`}
                      </TableCell>
                      <TableCell>
                        {booking.vehicle_make} {booking.vehicle_model}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {booking.service_description}
                      </TableCell>
                      <TableCell>
                        {mechanicName(booking.mechanic_id, mechanics?.items)}
                      </TableCell>
                      <TableCell>
                        <BookingStatusBadge status={booking.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(booking.amount)}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDateTime(booking.scheduled_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Rows per page</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(0n);
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    data-ocid="bookings.page_size"
                    className="w-20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={s.toString()}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 0}
                  onClick={() => setPage((p) => p - 1n)}
                  data-ocid="bookings.pagination_prev"
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </Button>
                <span className="px-3 font-mono text-xs text-muted-foreground">
                  Page {totalPages === 0 ? 0 : currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1n)}
                  data-ocid="bookings.pagination_next"
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
