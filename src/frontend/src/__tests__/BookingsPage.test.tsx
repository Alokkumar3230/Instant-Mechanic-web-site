import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BookingStatus } from "@/backend";
import BookingsPage from "@/pages/BookingsPage";
import { bookingFixture, customerFixture, mechanicFixture } from "./fixtures";
import { renderWithProviders } from "./render";
import { mockActor } from "./setup";

// The real @radix-ui/react-select dropdown hangs in jsdom (its pointer/focus
// sequence never settles), so the status-filter test cannot open it. This mock
// renders the select as a button trigger plus clickable item buttons that call
// onValueChange directly, exercising the same filter wiring without a real
// dropdown. Content only renders while the select is open, matching the real
// component, so closed dropdowns never leak their item text into the page.
// It must provide every primitive `@/components/ui/select` uses.
vi.mock("@radix-ui/react-select", async () => {
  const { createContext, createElement, useContext, useState } = await import(
    "react"
  );

  const SelectContext = createContext<{
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
  }>({ value: "", onValueChange: () => {}, open: false, setOpen: () => {} });

  return {
    Root: ({
      value,
      onValueChange,
      children,
    }: {
      value?: string;
      onValueChange?: (value: string) => void;
      children?: React.ReactNode;
    }) => {
      const [open, setOpen] = useState(false);
      return createElement(
        SelectContext.Provider,
        {
          value: {
            value: value ?? "",
            onValueChange: onValueChange ?? (() => {}),
            open,
            setOpen,
          },
        },
        children,
      );
    },
    Trigger: ({
      children,
      ...props
    }: { children?: React.ReactNode; [key: string]: any }) => {
      const { open, setOpen } = useContext(SelectContext);
      return createElement(
        "button",
        { type: "button", ...props, onClick: () => setOpen(!open) },
        children,
      );
    },
    Value: ({ placeholder }: { placeholder?: string }) => {
      const { value } = useContext(SelectContext);
      return createElement("span", null, value || placeholder || "");
    },
    Content: ({ children }: { children?: React.ReactNode }) => {
      const { open } = useContext(SelectContext);
      return open ? createElement("div", null, children) : null;
    },
    Portal: ({ children }: { children?: React.ReactNode }) =>
      createElement("div", null, children),
    Item: ({
      value,
      children,
      ...props
    }: { value: string; children?: React.ReactNode; [key: string]: any }) => {
      const { onValueChange, setOpen } = useContext(SelectContext);
      return createElement(
        "button",
        {
          type: "button",
          ...props,
          onClick: () => {
            onValueChange(value);
            setOpen(false);
          },
        },
        children,
      );
    },
    ItemIndicator: ({ children }: { children?: React.ReactNode }) =>
      createElement("span", null, children),
    ItemText: ({ children }: { children?: React.ReactNode }) =>
      createElement("span", null, children),
    Icon: ({ children }: { children?: React.ReactNode }) =>
      createElement("span", null, children),
    Viewport: ({ children }: { children?: React.ReactNode }) =>
      createElement("div", null, children),
    ScrollUpButton: () => null,
    ScrollDownButton: () => null,
    Separator: () => null,
    Label: ({ children }: { children?: React.ReactNode }) =>
      createElement("div", null, children),
    Group: ({ children }: { children?: React.ReactNode }) =>
      createElement("div", null, children),
  };
});

describe("BookingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActor.listBookings.mockResolvedValue({
      total: 2n,
      page: 0n,
      limit: 25n,
      items: [
        bookingFixture({
          id: 1n,
          status: BookingStatus.pending,
          amount: 8000n,
          customer_id: 1n,
          mechanic_id: 3n,
        }),
        bookingFixture({
          id: 2n,
          status: BookingStatus.completed,
          amount: 15000n,
          vehicle_make: "Honda",
          vehicle_model: "Civic",
          service_description: "Brake pads",
          customer_id: 2n,
          mechanic_id: 4n,
        }),
      ],
    });
    mockActor.listServiceCategories.mockResolvedValue([
      { id: 0n, name: "Oil Change" },
      { id: 1n, name: "Brake Repair" },
    ]);
    mockActor.listMechanics.mockResolvedValue({
      total: 2n,
      page: 0n,
      limit: 50n,
      items: [
        mechanicFixture({ id: 3n, name: "Maria Smith" }),
        mechanicFixture({ id: 4n, name: "Carlos Garcia" }),
      ],
    });
    mockActor.listCustomers.mockResolvedValue({
      total: 2n,
      page: 0n,
      limit: 50n,
      items: [
        customerFixture({ id: 1n, name: "James Johnson" }),
        customerFixture({ id: 2n, name: "Linda Brown" }),
      ],
    });
  });

  it("renders the bookings table with all columns and rows", async () => {
    renderWithProviders(<BookingsPage />);

    expect(await screen.findByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("James Johnson")).toBeInTheDocument();
    expect(screen.getByText("Linda Brown")).toBeInTheDocument();
    expect(screen.getByText("Toyota Camry")).toBeInTheDocument();
    expect(screen.getByText("Honda Civic")).toBeInTheDocument();
    expect(screen.getByText("Maria Smith")).toBeInTheDocument();
    expect(screen.getByText("Carlos Garcia")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("$8,000")).toBeInTheDocument();
    expect(screen.getByText("$15,000")).toBeInTheDocument();

    for (const header of [
      "Booking ID",
      "Customer",
      "Vehicle",
      "Service",
      "Mechanic",
      "Status",
      "Amount",
      "Date/Time",
    ]) {
      expect(screen.getByText(header)).toBeInTheDocument();
    }
  });

  it("debounces the search input into the listBookings filter", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingsPage />);
    await screen.findByText("#1");

    await user.type(screen.getByTestId("bookings.search_input"), "toyota");

    await waitFor(() => {
      expect(mockActor.listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ search: "toyota" }),
      );
    });
  });

  it("filters by status through the status select", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingsPage />);
    await screen.findByText("#1");

    // The trigger renders before any selection. The real Radix dropdown hangs
    // in jsdom, so the mocked select renders items as buttons that call
    // onValueChange directly; selecting "Completed" must flow through the
    // status filter into the listBookings query.
    expect(screen.getByTestId("bookings.filter.status")).toBeInTheDocument();

    await user.click(screen.getByTestId("bookings.filter.status"));
    await user.click(screen.getByRole("button", { name: "Completed" }));

    await waitFor(() => {
      expect(mockActor.listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ status: "completed" }),
      );
    });
  });

  it("sorts by amount, toggling direction on repeat clicks", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingsPage />);
    await screen.findByText("#1");

    await user.click(screen.getByTestId("bookings.sort.amount"));
    await waitFor(() => {
      expect(mockActor.listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: "amount", sort_desc: true }),
      );
    });

    await user.click(screen.getByTestId("bookings.sort.amount"));
    await waitFor(() => {
      expect(mockActor.listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ sort_by: "amount", sort_desc: false }),
      );
    });
  });

  it("paginates to the next page", async () => {
    mockActor.listBookings.mockResolvedValue({
      total: 30n,
      page: 0n,
      limit: 25n,
      items: [bookingFixture({ id: 1n })],
    });
    const user = userEvent.setup();
    renderWithProviders(<BookingsPage />);
    await screen.findByText("#1");

    await user.click(screen.getByTestId("bookings.pagination_next"));

    await waitFor(() => {
      expect(mockActor.listBookings).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1n }),
      );
    });
  });

  it("shows an empty state when no bookings match", async () => {
    mockActor.listBookings.mockResolvedValue({
      total: 0n,
      page: 0n,
      limit: 25n,
      items: [],
    });

    renderWithProviders(<BookingsPage />);

    expect(await screen.findByText("No bookings yet")).toBeInTheDocument();
    expect(screen.getByTestId("empty_state")).toBeInTheDocument();
  });

  it("shows a table skeleton while bookings load", async () => {
    mockActor.listBookings.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<BookingsPage />);

    expect(await screen.findByTestId("loading_state")).toBeInTheDocument();
  });
});
