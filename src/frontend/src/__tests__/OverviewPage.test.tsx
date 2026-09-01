import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingStatus, type DashboardStats } from "@/backend";
import OverviewPage from "@/pages/OverviewPage";
import { bookingFixture, customerFixture, statsFixture } from "./fixtures";
import { renderWithProviders } from "./render";
import { mockActor } from "./setup";

describe("OverviewPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActor.getDashboardStats.mockResolvedValue(statsFixture);
    mockActor.listBookings.mockResolvedValue({
      total: 2n,
      page: 0n,
      limit: 50n,
      items: [
        bookingFixture({ id: 1n }),
        bookingFixture({
          id: 2n,
          status: BookingStatus.completed,
          customer_id: 2n,
        }),
      ],
    });
    mockActor.listCustomers.mockResolvedValue({
      total: 2n,
      page: 0n,
      limit: 50n,
      items: [
        customerFixture(),
        customerFixture({ id: 2n, name: "Linda Brown" }),
      ],
    });
  });

  it("renders all eight KPI cards with live values from canister data", async () => {
    renderWithProviders(<OverviewPage />);

    const cards = await screen.findAllByTestId("kpi.card");
    expect(cards).toHaveLength(8);

    // The cards render with skeletons while stats resolve; wait for a live
    // value before asserting the rest of the KPI numbers.
    expect(await screen.findByText("520")).toBeInTheDocument();

    const kpi = screen.getByRole("region", {
      name: "Key performance indicators",
    });
    expect(within(kpi).getByText("Total bookings")).toBeInTheDocument();
    expect(within(kpi).getByText("520")).toBeInTheDocument();
    expect(within(kpi).getByText("Today's bookings")).toBeInTheDocument();
    expect(within(kpi).getByText("12")).toBeInTheDocument();
    expect(within(kpi).getByText("Completed")).toBeInTheDocument();
    expect(within(kpi).getByText("310")).toBeInTheDocument();
    expect(within(kpi).getByText("Pending")).toBeInTheDocument();
    expect(within(kpi).getByText("42")).toBeInTheDocument();
    expect(within(kpi).getByText("Cancelled")).toBeInTheDocument();
    expect(within(kpi).getByText("38")).toBeInTheDocument();
    expect(within(kpi).getByText("Total revenue")).toBeInTheDocument();
    expect(within(kpi).getByText("$48,250")).toBeInTheDocument();
    expect(within(kpi).getByText("Active mechanics")).toBeInTheDocument();
    expect(within(kpi).getByText("16")).toBeInTheDocument();
    expect(within(kpi).getByText("New customers")).toBeInTheDocument();
    expect(within(kpi).getByText("9")).toBeInTheDocument();
  });

  it("shows skeleton loading before stats resolve, then live values", async () => {
    let resolveStats!: (value: DashboardStats) => void;
    mockActor.getDashboardStats.mockReturnValue(
      new Promise((resolve) => {
        resolveStats = resolve;
      }),
    );
    mockActor.listBookings.mockReturnValue(new Promise(() => {}));
    mockActor.listCustomers.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<OverviewPage />);

    const cards = await screen.findAllByTestId("kpi.card");
    expect(cards).toHaveLength(8);
    expect(screen.queryByText("520")).not.toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-slot="skeleton"]').length,
    ).toBeGreaterThan(0);

    resolveStats(statsFixture);
    await waitFor(() => expect(screen.getByText("520")).toBeInTheDocument());
  });

  it("shows an error state when the dashboard stats fail to load", async () => {
    mockActor.getDashboardStats.mockRejectedValue(new Error("boom"));

    renderWithProviders(<OverviewPage />);

    expect(
      await screen.findByText("Couldn't load dashboard"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("error_state")).toBeInTheDocument();
  });

  it("renders the recent activity feed from live bookings", async () => {
    renderWithProviders(<OverviewPage />);

    expect(await screen.findByTestId("activity_feed")).toBeInTheDocument();
    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    // The feed card renders a skeleton while bookings/customers resolve; wait
    // for a feed row before asserting its contents.
    expect(await screen.findByText("James Johnson")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });
});
