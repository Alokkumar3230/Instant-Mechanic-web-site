import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Layout } from "@/components/Layout";
import { bookingFixture, customerFixture, statsFixture } from "./fixtures";
import { renderWithProviders } from "./render";
import { mockActor, mockIdentityState, mockRouterState } from "./setup";

describe("Layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIdentityState.isAuthenticated = true;
    mockIdentityState.isInitializing = false;
    mockRouterState.pathname = "/";
    mockActor.getDashboardStats.mockResolvedValue(statsFixture);
    mockActor.listBookings.mockResolvedValue({
      total: 1n,
      page: 0n,
      limit: 50n,
      items: [bookingFixture()],
    });
    mockActor.listCustomers.mockResolvedValue({
      total: 1n,
      page: 0n,
      limit: 50n,
      items: [customerFixture()],
    });
    mockActor.simulatorTick.mockResolvedValue(undefined);
    mockActor.seedDemoData.mockResolvedValue(undefined);
  });

  it("gates the dashboard behind Internet Identity sign-in", () => {
    mockIdentityState.isAuthenticated = false;

    renderWithProviders(<Layout>content</Layout>);

    expect(
      screen.getByText("Sign in with Internet Identity"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("signin.screen")).toBeInTheDocument();
  });

  it("shows the connecting screen while identity initializes", () => {
    mockIdentityState.isInitializing = true;

    renderWithProviders(<Layout>content</Layout>);

    expect(screen.getByTestId("app.loading_state")).toBeInTheDocument();
  });

  it("renders navigation and page content when authenticated", async () => {
    renderWithProviders(<Layout>page content</Layout>);

    // "Overview" also appears as the header page title for pathname "/", so
    // scope the nav assertions to the sidebar navigation.
    const nav = await screen.findByRole("navigation", {
      name: "Main navigation",
    });
    expect(within(nav).getByText("Overview")).toBeInTheDocument();
    expect(within(nav).getByText("Analytics")).toBeInTheDocument();
    expect(within(nav).getByText("Bookings")).toBeInTheDocument();
    expect(within(nav).getByText("Mechanics")).toBeInTheDocument();
    expect(within(nav).getByText("Customers")).toBeInTheDocument();
    expect(screen.getByText("page content")).toBeInTheDocument();
    expect(screen.getByText("Instant Mechanic")).toBeInTheDocument();
  });

  it("toggles dark mode and persists the choice across sessions", async () => {
    localStorage.clear();
    const user = userEvent.setup();
    renderWithProviders(<Layout>content</Layout>, { theme: true });

    const toggle = await screen.findByTestId("theme.toggle");
    // defaultTheme="dark" → resolved dark → labelled to switch to light.
    expect(toggle).toHaveAttribute("aria-label", "Switch to light mode");

    await user.click(toggle);

    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-label", "Switch to dark mode");
    });
    expect(localStorage.getItem("instant-mechanic-theme")).toBe("light");
  });
});
