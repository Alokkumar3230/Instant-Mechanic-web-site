import Map "mo:core/Map";
import Types "../types/common";
import AnalyticsLib "../lib/analytics";

mixin (bookings : Map.Map<Nat, Types.Booking>) {
  public query func getBookingsOverTime(days : Nat) : async [Types.AnalyticsPoint] {
    AnalyticsLib.getBookingsOverTime(bookings, days)
  };

  public query func getRevenueOverTime(days : Nat) : async [Types.AnalyticsPoint] {
    AnalyticsLib.getRevenueOverTime(bookings, days)
  };

  public query func getStatusBreakdown() : async [Types.StatusBreakdown] {
    AnalyticsLib.getStatusBreakdown(bookings)
  };

  public query func getCategoryBreakdown() : async [Types.CategoryBreakdown] {
    AnalyticsLib.getCategoryBreakdown(bookings)
  };
};