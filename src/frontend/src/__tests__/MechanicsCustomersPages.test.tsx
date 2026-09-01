import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MechanicStatus } from "@/backend";
import CustomersPage from "@/pages/CustomersPage";
import MechanicsPage from "@/pages/MechanicsPage";
import { customerFixture, mechanicFixture } from "./fixtures";
import { renderWithProviders } from "./render";
import { mockActor } from "./setup";

describe("MechanicsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActor.listMechanics.mockResolvedValue({
      total: 2n,
      page: 0n,
      limit: 50n,
      items: [
        mechanicFixture({
          id: 1n,
          name: "Maria Smith",
          status: MechanicStatus.available,
          specialty: "Brake Repair",
          jobs_completed: 120n,
        }),
        mechanicFixture({
          id: 2n,
          name: "Carlos Garcia",
          status: MechanicStatus.busy,
          specialty: "Oil Change",
          jobs_completed: 88n,
          current_booking_id: 7n,
        }),
      ],
    });
  });

  it("lists seeded mechanics with status, specialty, and workload", async () => {
    renderWithProviders(<MechanicsPage />);

    expect(await screen.findByText("Maria Smith")).toBeInTheDocument();
    expect(screen.getByText("Carlos Garcia")).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
    expect(screen.getByText("Busy")).toBeInTheDocument();
    expect(screen.getByText("Brake Repair")).toBeInTheDocument();
    expect(screen.getByText("Oil Change")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
    // Current booking link for the busy mechanic.
    expect(screen.getByText("#7")).toBeInTheDocument();
    expect(screen.getByText("2 on roster")).toBeInTheDocument();
  });

  it("shows an empty state when the roster is empty", async () => {
    mockActor.listMechanics.mockResolvedValue({
      total: 0n,
      page: 0n,
      limit: 50n,
      items: [],
    });

    renderWithProviders(<MechanicsPage />);

    expect(await screen.findByText("No mechanics yet")).toBeInTheDocument();
    expect(screen.getByTestId("empty_state")).toBeInTheDocument();
  });
});

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActor.listCustomers.mockResolvedValue({
      total: 2n,
      page: 0n,
      limit: 50n,
      items: [
        customerFixture({
          id: 1n,
          name: "James Johnson",
          email: "jamesjohnson1@gmail.com",
          phone: "+11234567890",
        }),
        customerFixture({
          id: 2n,
          name: "Linda Brown",
          email: "lindabrown2@yahoo.com",
          phone: "+10987654321",
        }),
      ],
    });
  });

  it("lists seeded customers with contact details", async () => {
    renderWithProviders(<CustomersPage />);

    expect(await screen.findByText("James Johnson")).toBeInTheDocument();
    expect(screen.getByText("Linda Brown")).toBeInTheDocument();
    expect(screen.getByText("jamesjohnson1@gmail.com")).toBeInTheDocument();
    expect(screen.getByText("+11234567890")).toBeInTheDocument();
    expect(screen.getByText("2 customers")).toBeInTheDocument();
  });

  it("passes the search term into the customers query", async () => {
    mockActor.listCustomers.mockResolvedValue({
      total: 0n,
      page: 0n,
      limit: 50n,
      items: [],
    });
    const user = userEvent.setup();
    renderWithProviders(<CustomersPage />);
    await screen.findByText("No customers yet");

    await user.type(screen.getByTestId("customers.search_input"), "james");

    await waitFor(() => {
      expect(mockActor.listCustomers).toHaveBeenCalledWith(
        expect.objectContaining({ search: "james" }),
      );
    });
  });

  it("shows an empty state when no customers match the search", async () => {
    mockActor.listCustomers.mockResolvedValue({
      total: 0n,
      page: 0n,
      limit: 50n,
      items: [],
    });
    const user = userEvent.setup();
    renderWithProviders(<CustomersPage />);
    await screen.findByText("No customers yet");

    await user.type(screen.getByTestId("customers.search_input"), "zzz");

    expect(
      await screen.findByText("No matching customers"),
    ).toBeInTheDocument();
  });
});
