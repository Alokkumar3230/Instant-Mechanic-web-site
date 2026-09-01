import { toast } from "sonner";

import type { BookingStatus } from "@/backend";

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  assigned: "Assigned",
  on_the_way: "On the way",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

/**
 * Toast helper for live booking status-change notifications. Fires a toast
 * describing a booking transitioning to a new status.
 */
export function notifyBookingStatusChange(
  bookingId: bigint,
  status: BookingStatus,
) {
  toast(`${STATUS_LABELS[status] ?? status}`, {
    description: `Booking #${bookingId} is now ${STATUS_LABELS[status]?.toLowerCase() ?? status}.`,
  });
}
