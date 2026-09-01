import { PocketIc } from "@dfinity/pic";
import { afterAll, beforeAll, expect, it } from "vitest";

import { idlFactory } from "../../src/frontend/src/declarations/backend.did.js";
import type {
  BookingFilter,
  _SERVICE,
} from "../../src/frontend/src/declarations/backend.did";

const PIC_URL = process.env.POCKET_IC_URL ?? "";
const BACKEND_WASM = process.env.BACKEND_WASM ?? "";

let pic: PocketIc | undefined;
let actor: _SERVICE;

/** A BookingFilter with every optional field absent. */
function emptyFilter(): BookingFilter {
  return {
    sort_by: [],
    status: [],
    date_to: [],
    date_from: [],
    page: 0n,
    search: [],
    sort_desc: true,
    limit: 50n,
    customer_id: [],
    service_category: [],
    mechanic_id: [],
  };
}

beforeAll(async () => {
  pic = await PocketIc.create(PIC_URL);
  ({ actor } = await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: BACKEND_WASM,
  }));
});

afterAll(async () => {
  // `?.` because `beforeAll` may not have got that far. A failed
  // `PocketIc.create` otherwise stacks "Cannot read properties of undefined"
  // on top of the real error and buries the one line that explains the run.
  await pic?.tearDown();
});

it("answers empty-state reads instead of trapping", async () => {
  const stats = await actor.getDashboardStats();
  expect(stats.total_bookings).toBe(0n);
  expect(stats.today_bookings).toBe(0n);
  expect(stats.completed).toBe(0n);
  expect(stats.pending).toBe(0n);
  expect(stats.cancelled).toBe(0n);
  expect(stats.total_revenue).toBe(0n);
  expect(stats.active_mechanics).toBe(0n);
  expect(stats.new_customers_30d).toBe(0n);

  const page = await actor.listBookings(emptyFilter());
  expect(page.total).toBe(0n);
  expect(page.items).toEqual([]);

  expect(await actor.getBooking(0n)).toEqual([]);
  expect(await actor.getMechanic(0n)).toEqual([]);
  expect(await actor.getCustomer(0n)).toEqual([]);

  const mechanics = await actor.listMechanics({
    status: [],
    page: 0n,
    search: [],
    limit: 50n,
  });
  expect(mechanics.total).toBe(0n);
  expect(mechanics.items).toEqual([]);

  const customers = await actor.listCustomers({ page: 0n, search: [], limit: 50n });
  expect(customers.total).toBe(0n);
  expect(customers.items).toEqual([]);

  expect(await actor.listServiceCategories()).toEqual([]);

  const overTime = await actor.getBookingsOverTime(90n);
  expect(overTime).toHaveLength(90);
  expect(overTime.every((p) => p.value === 0n)).toBe(true);

  const revenue = await actor.getRevenueOverTime(90n);
  expect(revenue).toHaveLength(90);

  const statusBreakdown = await actor.getStatusBreakdown();
  expect(statusBreakdown).toHaveLength(6);
  expect(statusBreakdown.every((s) => s.count === 0n)).toBe(true);

  expect(await actor.getCategoryBreakdown()).toEqual([]);

  const doc = await actor.getApiDoc();
  expect(doc).toContain("Instant Mechanic");
  expect(doc).toContain("getDashboardStats");
  expect(doc).toContain("listBookings");
});

it("seeds demo data idempotently and serves it through the public API", async () => {
  await actor.seedDemoData();

  const stats = await actor.getDashboardStats();
  expect(stats.total_bookings).toBe(520n);
  expect(stats.total_revenue).toBeGreaterThan(0n);

  const page = await actor.listBookings(emptyFilter());
  expect(page.total).toBe(520n);
  expect(page.items.length).toBeGreaterThan(0);

  const mechanics = await actor.listMechanics({
    status: [],
    page: 0n,
    search: [],
    limit: 50n,
  });
  // seedDemoData loops `Nat.range(0, 20)`, whose upper bound is exclusive, so
  // exactly 20 mechanics (ids 0..19) are created — the same semantics that make
  // the 55-customer and 520-booking counts below.
  expect(mechanics.total).toBe(20n);

  const customers = await actor.listCustomers({ page: 0n, search: [], limit: 50n });
  expect(customers.total).toBe(55n);

  const categories = await actor.listServiceCategories();
  expect(categories).toHaveLength(8);

  // Idempotent: re-seeding with data present must not duplicate anything.
  await actor.seedDemoData();
  expect((await actor.listBookings(emptyFilter())).total).toBe(520n);
});

it("filters, sorts, and paginates bookings", async () => {
  await actor.seedDemoData();

  const pending = await actor.listBookings({
    ...emptyFilter(),
    status: [{ pending: null }],
  });
  expect(pending.total).toBeGreaterThan(0n);
  expect(pending.items.every((b) => "pending" in b.status)).toBe(true);

  const first = (await actor.listBookings(emptyFilter())).items[0];
  const byId = await actor.listBookings({
    ...emptyFilter(),
    search: [first.id.toString()],
  });
  expect(byId.total).toBeGreaterThanOrEqual(1n);
  expect(byId.items.some((b) => b.id === first.id)).toBe(true);

  const byMechanic = await actor.listBookings({
    ...emptyFilter(),
    mechanic_id: [0n],
  });
  expect(byMechanic.total).toBeGreaterThan(0n);
  expect(byMechanic.items.every((b) => b.mechanic_id[0] === 0n)).toBe(true);

  const page1 = await actor.listBookings({ ...emptyFilter(), page: 1n, limit: 10n });
  expect(page1.items).toHaveLength(10);
  expect(page1.page).toBe(1n);

  const sorted = await actor.listBookings({
    ...emptyFilter(),
    sort_by: ["amount"],
    sort_desc: true,
    limit: 5n,
  });
  const amounts = sorted.items.map((b) => b.amount);
  const descending = [...amounts].sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  expect(amounts).toEqual(descending);
});

it("advances a booking through its lifecycle and rejects invalid transitions", async () => {
  await actor.seedDemoData();

  const pending = await actor.listBookings({
    ...emptyFilter(),
    status: [{ pending: null }],
    limit: 1n,
  });
  expect(pending.items.length).toBeGreaterThan(0);
  const booking = pending.items[0];

  const updated = await actor.updateBookingStatus(booking.id, { assigned: null });
  expect(updated).toHaveLength(1);
  expect(updated[0]!.status).toEqual({ assigned: null });

  const fetched = await actor.getBooking(booking.id);
  expect(fetched).toHaveLength(1);
  expect(fetched[0]!.status).toEqual({ assigned: null });

  // assigned -> completed is not a valid transition; the booking is returned
  // unchanged rather than an error.
  const unchanged = await actor.updateBookingStatus(booking.id, { completed: null });
  expect(unchanged).toHaveLength(1);
  expect(unchanged[0]!.status).toEqual({ assigned: null });

  // A missing booking returns null ([]), not a trap.
  expect(await actor.updateBookingStatus(999_999n, { pending: null })).toEqual([]);
});

it("advances in-flight bookings via simulatorTick", async () => {
  await actor.seedDemoData();

  const before = await actor.getStatusBreakdown();
  await actor.simulatorTick();
  const after = await actor.getStatusBreakdown();

  const sumBefore = before.reduce((acc, s) => acc + s.count, 0n);
  const sumAfter = after.reduce((acc, s) => acc + s.count, 0n);
  expect(sumAfter).toBe(sumBefore);

  const moved = before.some((s, i) => s.count !== after[i]!.count);
  expect(moved).toBe(true);
});

it("reports analytics over seeded data", async () => {
  await actor.seedDemoData();

  const overTime = await actor.getBookingsOverTime(90n);
  expect(overTime).toHaveLength(90);
  const overTimeTotal = overTime.reduce((acc, p) => acc + p.value, 0n);
  expect(overTimeTotal).toBeGreaterThan(0n);
  expect(overTimeTotal).toBeLessThanOrEqual(520n);

  const revenue = await actor.getRevenueOverTime(90n);
  expect(revenue).toHaveLength(90);

  const status = await actor.getStatusBreakdown();
  const statusTotal = status.reduce((acc, s) => acc + s.count, 0n);
  expect(statusTotal).toBe(520n);

  const categories = await actor.getCategoryBreakdown();
  expect(categories.length).toBeGreaterThan(0);
  const categoryTotal = categories.reduce((acc, c) => acc + c.count, 0n);
  expect(categoryTotal).toBe(520n);
});