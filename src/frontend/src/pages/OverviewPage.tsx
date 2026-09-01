import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  DollarSign,
  UserPlus,
  Wrench,
  XCircle,
} from "lucide-react";

import { ActivityFeed } from "@/components/ActivityFeed";
import { KpiCard } from "@/components/KpiCard";
import { ErrorState } from "@/components/StateViews";
import { useDashboardStats } from "@/hooks/useQueries";
import { formatCurrency, formatNumber } from "@/lib/format";

export default function OverviewPage() {
  const stats = useDashboardStats();

  const loading = stats.isLoading;
  const error = stats.isError;
  const data = stats.data;

  return (
    <div className="space-y-6">
      {error ? (
        <ErrorState
          title="Couldn't load dashboard"
          description="We couldn't fetch the latest metrics. It will retry automatically."
          onRetry={() => void stats.refetch()}
        />
      ) : (
        <>
          <section
            aria-label="Key performance indicators"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <KpiCard
              label="Total bookings"
              value={data ? formatNumber(data.total_bookings) : "—"}
              icon={CalendarCheck}
              hint="All time"
              loading={loading}
            />
            <KpiCard
              label="Today's bookings"
              value={data ? formatNumber(data.today_bookings) : "—"}
              icon={CalendarClock}
              hint="Since midnight"
              loading={loading}
            />
            <KpiCard
              label="Completed"
              value={data ? formatNumber(data.completed) : "—"}
              icon={CheckCircle2}
              hint="All time"
              loading={loading}
            />
            <KpiCard
              label="Pending"
              value={data ? formatNumber(data.pending) : "—"}
              icon={Clock}
              hint="Awaiting action"
              loading={loading}
            />
            <KpiCard
              label="Cancelled"
              value={data ? formatNumber(data.cancelled) : "—"}
              icon={XCircle}
              hint="All time"
              loading={loading}
            />
            <KpiCard
              label="Total revenue"
              value={data ? formatCurrency(data.total_revenue) : "—"}
              icon={DollarSign}
              hint="All time"
              loading={loading}
            />
            <KpiCard
              label="Active mechanics"
              value={data ? formatNumber(data.active_mechanics) : "—"}
              icon={Wrench}
              hint="Currently on duty"
              loading={loading}
            />
            <KpiCard
              label="New customers"
              value={data ? formatNumber(data.new_customers_30d) : "—"}
              icon={UserPlus}
              hint="Last 30 days"
              loading={loading}
            />
          </section>

          <section aria-label="Recent activity">
            <ActivityFeed />
          </section>
        </>
      )}
    </div>
  );
}
