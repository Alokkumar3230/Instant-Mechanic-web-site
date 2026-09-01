import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/common";
import BookingsLib "../lib/bookings";

mixin (
  bookings : Map.Map<Nat, Types.Booking>,
  customers : Map.Map<Nat, Types.Customer>,
  mechanics : Map.Map<Nat, Types.Mechanic>
) {
  public query func listBookings(filter : Types.BookingFilter) : async Types.BookingPage {
    BookingsLib.listBookings(bookings, customers, filter)
  };

  public query func getBooking(id : Nat) : async ?Types.Booking {
    BookingsLib.getBooking(bookings, id)
  };

  public shared ({ caller }) func updateBookingStatus(id : Nat, status : Types.BookingStatus) : async ?Types.Booking {
    ignore caller;
    BookingsLib.updateBookingStatus(bookings, mechanics, id, status, Time.now())
  };
};