import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingStatus } from "@/backend";
import BookingsDetailPage from "@/pages/BookingsDetailPage";
import { bookingFixture, customerFixture, mechanicFixture } from "./fixtures";
import { renderWithProviders } from "./render";
import { mockActor, mockRouterState } from "./setup";

describe("BookingsDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouterState.params = { id: "1" };
    mockActor.getBooking.mockResolvedValue(bookingFixture({ id: 1n }));
    mockActor.getCustomer.mockResolvedValue(customerFixture());
    mockActor.getMechanic.mockResolvedValue(mechanicFixture());
    mockActor.updateBookingStatus.mockResolvedValue(
      bookingFixture({ id: 1n, status: BookingStatus.assigned }),
    );
  });

  it("renders the booking detail with customer, mechanic, and status history", async () => {
    renderWithProviders(<BookingsDetailPage />);

    expect(await screen.findByText("Booking #1")).toBeInTheDocument();
    // The customer name appears in the header subtitle and the customer card.
    expect(screen.getAllByText("James Johnson")).toHaveLength(2);
    expect(screen.getByText("Maria Smith")).toBeInTheDocument();
    expect(screen.getByText("Routine maintenance")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("$8,000")).toBeInTheDocument();
    // Status timeline: pending is current, later steps not reached. "Pending"
    // also appears in the header status badge, so scope to the badge.
    expect(
      within(screen.getByTestId("status.badge")).getByText("Pending"),
    ).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Assigned")).toBeInTheDocument();
    expect(screen.getByText("On the way")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("advances a pending booking to assigned through the confirm dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingsDetailPage />);
    await screen.findByText("Booking #1");

    await user.click(screen.getByTestId("booking.advance_status"));
    expect(await screen.findByText("Advance booking #1?")).toBeInTheDocument();

    await user.click(screen.getByTestId("booking.advance_confirm"));

    await waitFor(() => {
      expect(mockActor.updateBookingStatus).toHaveBeenCalledWith(
        1n,
        "assigned",
      );
    });
  });

  it("shows the not-found state for an unknown booking id", async () => {
    mockActor.getBooking.mockResolvedValue(null);

    renderWithProviders(<BookingsDetailPage />);

    expect(await screen.findByText("Booking not found")).toBeInTheDocument();
    expect(screen.getByTestId("booking.back")).toBeInTheDocument();
  });
});
