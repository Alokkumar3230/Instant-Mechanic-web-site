import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AnalyticsPage from "@/pages/AnalyticsPage";
import { renderWithProviders } from "./render";
import { mockActor } from "./setup";

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActor.getBookingsOverTime.mockResolvedValue([
      { period: "2026-08-01", value: 5n },
      { period: "2026-08-02", value: 7n },
    ]);
    mockActor.getRevenueOverTime.mockResolvedValue([
      { period: "2026-08-01", value: 40000n },
      { period: "2026-08-02", value: 60000n },
    ]);
    mockActor.getStatusBreakdown.mockResolvedValue([
      { status: "pending", count: 3n },
      { status: "completed", count: 9n },
    ]);
    mockActor.getCategoryBreakdown.mockResolvedValue([
      { category: "Oil Change", count: 6n },
      { category: "Brake Repair", count: 4n },
    ]);
  });

  it("renders all four charts from live analytics data", async () => {
    renderWithProviders(<AnalyticsPage />);

    expect(await screen.findByText("Bookings over time")).toBeInTheDocument();
    expect(screen.getByText("Revenue over time")).toBeInTheDocument();
    expect(screen.getByText("Booking status breakdown")).toBeInTheDocument();
    expect(screen.getByText("Service category breakdown")).toBeInTheDocument();
    expect(screen.getAllByTestId("analytics.chart_card")).toHaveLength(4);
    // Each chart card renders a recharts chart container fed by live data
    // (the container only renders when its data array is non-empty). Legend
    // text cannot be asserted: recharts' ResponsiveContainer measures 0x0 in
    // jsdom, so chart internals never render.
    expect(document.querySelectorAll('[data-slot="chart"]')).toHaveLength(4);
  });

  it("shows chart skeletons while analytics load", async () => {
    mockActor.getBookingsOverTime.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<AnalyticsPage />);

    expect(await screen.findAllByTestId("loading_state")).toHaveLength(4);
  });

  it("shows an empty state when there is no analytics data", async () => {
    mockActor.getBookingsOverTime.mockResolvedValue([]);
    mockActor.getRevenueOverTime.mockResolvedValue([]);
    mockActor.getStatusBreakdown.mockResolvedValue([]);
    mockActor.getCategoryBreakdown.mockResolvedValue([]);

    renderWithProviders(<AnalyticsPage />);

    expect(await screen.findByText("No analytics yet")).toBeInTheDocument();
  });
});
