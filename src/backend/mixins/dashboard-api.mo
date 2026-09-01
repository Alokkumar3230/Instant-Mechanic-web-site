import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/common";
import DashboardLib "../lib/dashboard";

mixin (
  bookings : Map.Map<Nat, Types.Booking>,
  customers : Map.Map<Nat, Types.Customer>,
  mechanics : Map.Map<Nat, Types.Mechanic>
) {
  public query func getDashboardStats() : async Types.DashboardStats {
    DashboardLib.getDashboardStats(bookings, customers, mechanics, Time.now())
  };
};