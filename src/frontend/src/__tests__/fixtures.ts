import type {
  Booking,
  BookingStatus,
  Customer,
  DashboardStats,
  Mechanic,
  MechanicStatus,
} from "@/backend";

export const statsFixture: DashboardStats = {
  total_bookings: 520n,
  today_bookings: 12n,
  completed: 310n,
  pending: 42n,
  cancelled: 38n,
  total_revenue: 48250n,
  active_mechanics: 16n,
  new_customers_30d: 9n,
};

export const emptyStatsFixture: DashboardStats = {
  total_bookings: 0n,
  today_bookings: 0n,
  completed: 0n,
  pending: 0n,
  cancelled: 0n,
  total_revenue: 0n,
  active_mechanics: 0n,
  new_customers_30d: 0n,
};

export function bookingFixture(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 1n,
    status: "pending" as BookingStatus,
    updated_at: 1_700_000_000_000_000_000n,
    service_description: "Routine maintenance",
    created_at: 1_700_000_000_000_000_000n,
    vehicle_model: "Camry",
    customer_id: 1n,
    scheduled_at: 1_700_000_000_000_000_000n,
    service_category: "Oil Change",
    vehicle_make: "Toyota",
    amount: 8000n,
    mechanic_id: 2n,
    ...overrides,
  };
}

export function mechanicFixture(overrides: Partial<Mechanic> = {}): Mechanic {
  return {
    id: 1n,
    status: "available" as MechanicStatus,
    current_booking_id: undefined,
    name: "Maria Smith",
    created_at: 1_700_000_000_000_000_000n,
    specialty: "Brake Repair",
    jobs_completed: 120n,
    ...overrides,
  };
}

export function customerFixture(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1n,
    name: "James Johnson",
    created_at: 1_700_000_000_000_000_000n,
    email: "jamesjohnson1@gmail.com",
    phone: "+11234567890",
    ...overrides,
  };
}
