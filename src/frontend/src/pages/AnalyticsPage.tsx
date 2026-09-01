import { useMemo } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState } from "@/components/StateViews";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/useQueries";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  assigned: "Assigned",
  on_the_way: "On the way",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--chart-5)",
  assigned: "var(--chart-2)",
  on_the_way: "var(--chart-4)",
  in_progress: "var(--chart-1)",
  completed: "var(--chart-3)",
  cancelled: "var(--chart-5)",
};

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/** Coerce a recharts tooltip value (which may be an array) into a bigint. */
function toBigInt(value: unknown): bigint {
  const n = Array.isArray(value) ? Number(value[0]) : Number(value);
  return BigInt(Math.round(Number.isFinite(n) ? n : 0));
}

const bookingsConfig = {
  bookings: { label: "Bookings", color: "var(--chart-1)" },
} satisfies ChartConfig;

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-2)" },
} satisfies ChartConfig;

function ChartCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-ocid="analytics.chart_card"
      className={cn(
        "rounded-lg border border-border bg-card p-4 shadow-subtle md:p-5",
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="font-display text-sm font-semibold tracking-tight">
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function ChartSkeleton() {
  return (
    <div
      data-ocid="loading_state"
      aria-label="Loading chart"
      className="space-y-3"
    >
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

function ChartEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      className="min-h-56 py-10"
    />
  );
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useAnalytics();

  const bookingsData = useMemo(
    () =>
      (data?.bookings ?? []).map((p) => ({
        period: p.period,
        value: Number(p.value),
      })),
    [data],
  );

  const revenueData = useMemo(
    () =>
      (data?.revenue ?? []).map((p) => ({
        period: p.period,
        value: Number(p.value),
      })),
    [data],
  );

  const statusData = useMemo(
    () =>
      (data?.status ?? []).map((s) => ({
        status: s.status,
        count: Number(s.count),
      })),
    [data],
  );

  const categoryData = useMemo(
    () =>
      (data?.categories ?? []).map((c) => ({
        category: c.category,
        count: Number(c.count),
      })),
    [data],
  );

  const statusConfig = useMemo(
    () =>
      Object.fromEntries(
        statusData.map((s) => [
          s.status,
          {
            label: STATUS_LABELS[s.status] ?? s.status,
            color: STATUS_COLORS[s.status] ?? "var(--chart-1)",
          },
        ]),
      ) satisfies ChartConfig,
    [statusData],
  );

  const categoryConfig = useMemo(
    () =>
      Object.fromEntries(
        categoryData.map((c, i) => [
          c.category,
          { label: c.category, color: PALETTE[i % PALETTE.length] },
        ]),
      ) satisfies ChartConfig,
    [categoryData],
  );

  const hasAnyData =
    bookingsData.length > 0 ||
    revenueData.length > 0 ||
    statusData.length > 0 ||
    categoryData.length > 0;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load analytics"
        description="We couldn't fetch the analytics data. Please try again."
        action={
          <button
            type="button"
            data-ocid="analytics.retry_button"
            onClick={() => refetch()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-smooth hover:bg-primary/90"
          >
            Retry
          </button>
        }
      />
    );
  }

  if (!hasAnyData) {
    return (
      <EmptyState
        title="No analytics yet"
        description="Once bookings start coming in, you'll see trends, status breakdowns, and service category mix here."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold tracking-tight">
            Performance overview
          </h3>
          <p className="text-sm text-muted-foreground">
            Live trends across the last 90 days, refreshed every 5 seconds.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
          Live
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ChartCard
          title="Bookings over time"
          subtitle="Total bookings per day, last 90 days"
        >
          {bookingsData.length === 0 ? (
            <ChartEmpty
              title="No bookings trend"
              description="Booking volume will appear here as bookings are created."
            />
          ) : (
            <ChartContainer config={bookingsConfig} className="h-64">
              <AreaChart
                data={bookingsData}
                margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatNumber(toBigInt(value))}
                    />
                  }
                />
                <defs>
                  <linearGradient id="fillBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-bookings)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-bookings)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="value"
                  name="bookings"
                  type="monotone"
                  fill="url(#fillBookings)"
                  stroke="var(--color-bookings)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Revenue over time"
          subtitle="Revenue per day, last 90 days"
        >
          {revenueData.length === 0 ? (
            <ChartEmpty
              title="No revenue trend"
              description="Revenue will appear here as bookings are completed."
            />
          ) : (
            <ChartContainer config={revenueConfig} className="h-64">
              <AreaChart
                data={revenueData}
                margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={52}
                  tickFormatter={(value) => `$${Number(value) / 1000}k`}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value) => formatCurrency(toBigInt(value))}
                    />
                  }
                />
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-revenue)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>
                <Area
                  dataKey="value"
                  name="revenue"
                  type="monotone"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Booking status breakdown"
          subtitle="Share of bookings by current status"
        >
          {statusData.length === 0 ? (
            <ChartEmpty
              title="No status data"
              description="Status distribution will appear here once bookings exist."
            />
          ) : (
            <ChartContainer
              config={statusConfig}
              className="mx-auto aspect-square h-64"
            >
              <PieChart>
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      nameKey="status"
                      formatter={(value) => formatNumber(toBigInt(value))}
                    />
                  }
                />
                <Pie
                  data={statusData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  strokeWidth={2}
                >
                  {statusData.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={STATUS_COLORS[entry.status] ?? "var(--chart-1)"}
                    />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="status" />}
                  className="flex-wrap"
                />
              </PieChart>
            </ChartContainer>
          )}
        </ChartCard>

        <ChartCard
          title="Service category breakdown"
          subtitle="Bookings by service category"
        >
          {categoryData.length === 0 ? (
            <ChartEmpty
              title="No category data"
              description="Service category mix will appear here once bookings exist."
            />
          ) : (
            <ChartContainer config={categoryConfig} className="h-64">
              <BarChart
                data={categoryData}
                margin={{ left: 0, right: 8, top: 4, bottom: 0 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={56}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  allowDecimals={false}
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      nameKey="category"
                      formatter={(value) => formatNumber(toBigInt(value))}
                    />
                  }
                />
                <Bar dataKey="count" name="category" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, i) => (
                    <Cell
                      key={entry.category}
                      fill={PALETTE[i % PALETTE.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
