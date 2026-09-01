import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { createActor } from "@/backend";
import type {
  Booking,
  BookingFilter,
  BookingStatus,
  CustomerFilter,
  MechanicFilter,
} from "@/backend";
import { notifyBookingStatusChange } from "@/lib/toast";

export const DEFAULT_BOOKING_FILTER: BookingFilter = {
  page: 0n,
  limit: 50n,
  sort_desc: true,
};

export const DEFAULT_MECHANIC_FILTER: MechanicFilter = {
  page: 0n,
  limit: 50n,
};

export const DEFAULT_CUSTOMER_FILTER: CustomerFilter = {
  page: 0n,
  limit: 50n,
};

const LIVE_QUERY_ROOTS = [
  "bookings",
  "booking",
  "dashboardStats",
  "analytics",
  "mechanics",
  "mechanic",
  "customers",
  "customer",
] as const;

export function useDashboardStats() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBookings(filter: BookingFilter = DEFAULT_BOOKING_FILTER) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["bookings", filter],
    queryFn: async () => {
      if (!actor) return null;
      return actor.listBookings(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useBooking(id: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBooking(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMechanics(filter: MechanicFilter = DEFAULT_MECHANIC_FILTER) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["mechanics", filter],
    queryFn: async () => {
      if (!actor) return null;
      return actor.listMechanics(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMechanic(id: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["mechanic", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMechanic(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomers(filter: CustomerFilter = DEFAULT_CUSTOMER_FILTER) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["customers", filter],
    queryFn: async () => {
      if (!actor) return null;
      return actor.listCustomers(filter);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomer(id: bigint) {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCustomer(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useServiceCategories() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["serviceCategories"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.listServiceCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAnalytics() {
  const { actor, isFetching } = useActor(createActor);
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      if (!actor) return null;
      const [bookings, revenue, status, categories] = await Promise.all([
        actor.getBookingsOverTime(90n),
        actor.getRevenueOverTime(90n),
        actor.getStatusBreakdown(),
        actor.getCategoryBreakdown(),
      ]);
      return { bookings, revenue, status, categories };
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateBookingStatus() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: bigint; status: BookingStatus }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateBookingStatus(input.id, input.status);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["booking"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

/**
 * One-time demo bootstrap: when the dashboard reports zero total bookings,
 * seeds the canister with demo data so a fresh deployment is not empty.
 * A ref guard ensures seeding never runs twice, and the zero-booking check
 * keeps it from touching a canister that already has data.
 */
export function useDemoBootstrap() {
  const { actor, isFetching } = useActor(createActor);
  const queryClient = useQueryClient();
  const statsQuery = useDashboardStats();
  const seededRef = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || seededRef.current) return;
    const stats = statsQuery.data;
    if (!stats) return;
    seededRef.current = true;
    if (stats.total_bookings > 0n) return;
    void actor
      .seedDemoData()
      .then(() => {
        void queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
        void queryClient.invalidateQueries({ queryKey: ["bookings"] });
        void queryClient.invalidateQueries({ queryKey: ["analytics"] });
        void queryClient.invalidateQueries({ queryKey: ["mechanics"] });
        void queryClient.invalidateQueries({ queryKey: ["customers"] });
      })
      .catch(() => {
        // Best-effort seeding; the ref guard prevents retry loops.
      });
  }, [actor, isFetching, statsQuery.data, queryClient]);
}

/**
 * Shared live-update entry point: refetches every active live query on a short
 * interval so changed bookings flow into tables, KPI cards, charts, and the
 * activity feed in place. Also advances the backend simulator each cycle so
 * bookings keep moving live. Pass `null` to pause polling (e.g. while signed
 * out).
 */
export function useLivePolling(intervalMs: number | null) {
  const queryClient = useQueryClient();
  const { actor } = useActor(createActor);
  return useQuery({
    queryKey: ["livePolling", intervalMs],
    queryFn: async () => {
      if (intervalMs === null) return null;
      if (actor) {
        try {
          await actor.simulatorTick();
        } catch {
          // Best-effort: the simulator must never break the poll cycle.
        }
      }
      await queryClient.invalidateQueries({
        predicate: (query) =>
          LIVE_QUERY_ROOTS.includes(
            query.queryKey[0] as (typeof LIVE_QUERY_ROOTS)[number],
          ),
      });
      return null;
    },
    refetchInterval: intervalMs ?? false,
    enabled: intervalMs !== null,
  });
}

/**
 * Watches the live bookings list and fires a toast whenever a booking's status
 * changes between polls, so the operator sees status transitions in place.
 */
export function useBookingStatusWatch(enabled: boolean) {
  const { data } = useBookings();
  const previous = useRef<Map<string, BookingStatus>>(new Map());

  useEffect(() => {
    if (!enabled || !data) return;
    const seen = new Set<string>();
    for (const booking of data.items) {
      const key = booking.id.toString();
      seen.add(key);
      const prior = previous.current.get(key);
      if (prior !== undefined && prior !== booking.status) {
        notifyBookingStatusChange(booking.id, booking.status);
      }
      previous.current.set(key, booking.status);
    }
    for (const key of previous.current.keys()) {
      if (!seen.has(key)) previous.current.delete(key);
    }
  }, [enabled, data]);
}

export type { Booking, BookingFilter, BookingStatus };
