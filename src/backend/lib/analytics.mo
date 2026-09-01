import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import Types "../types/common";

module {
  let dayNs : Int = 86_400_000_000_000;

  func pad2(n : Nat) : Text {
    if (n < 10) { "0" # n.toText() } else { n.toText() }
  };

  func formatDate(ns : Int) : Text {
    let days = ns / dayNs;
    let z = days + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if (mp < 10) { mp + 3 } else { mp - 9 };
    let yy = if (m <= 2) { y + 1 } else { y };
    yy.toNat().toText() # "-" # pad2(m.toNat()) # "-" # pad2(d.toNat())
  };

  func statusToText(s : Types.BookingStatus) : Text {
    switch (s) {
      case (#pending) "pending";
      case (#assigned) "assigned";
      case (#on_the_way) "on_the_way";
      case (#in_progress) "in_progress";
      case (#completed) "completed";
      case (#cancelled) "cancelled";
    }
  };

  public func getBookingsOverTime(
    bookings : Map.Map<Nat, Types.Booking>,
    days : Nat
  ) : [Types.AnalyticsPoint] {
    let now = Time.now();
    let todayStart = now - (now % dayNs);
    Array.tabulate(days, func i {
      let dayStart = todayStart - ((days.toInt() - 1 - i.toInt()) * dayNs);
      var count = 0;
      for (b in bookings.values()) {
        if (b.created_at >= dayStart and b.created_at < dayStart + dayNs) { count += 1 };
      };
      { period = formatDate(dayStart); value = count }
    })
  };

  public func getRevenueOverTime(
    bookings : Map.Map<Nat, Types.Booking>,
    days : Nat
  ) : [Types.AnalyticsPoint] {
    let now = Time.now();
    let todayStart = now - (now % dayNs);
    Array.tabulate(days, func i {
      let dayStart = todayStart - ((days.toInt() - 1 - i.toInt()) * dayNs);
      var sum = 0;
      for (b in bookings.values()) {
        if (b.status == #completed and b.created_at >= dayStart and b.created_at < dayStart + dayNs) {
          sum += b.amount;
        };
      };
      { period = formatDate(dayStart); value = sum }
    })
  };

  public func getStatusBreakdown(
    bookings : Map.Map<Nat, Types.Booking>
  ) : [Types.StatusBreakdown] {
    let statuses = ["pending", "assigned", "on_the_way", "in_progress", "completed", "cancelled"];
    statuses.map(func s {
      var count = 0;
      for (b in bookings.values()) {
        if (statusToText(b.status) == s) { count += 1 };
      };
      { status = s; count }
    })
  };

  public func getCategoryBreakdown(
    bookings : Map.Map<Nat, Types.Booking>
  ) : [Types.CategoryBreakdown] {
    var seen : [Text] = [];
    var result : [Types.CategoryBreakdown] = [];
    for (b in bookings.values()) {
      if (not seen.contains(b.service_category)) {
        seen := seen.concat([b.service_category]);
        var count = 0;
        for (b2 in bookings.values()) {
          if (b2.service_category == b.service_category) { count += 1 };
        };
        result := result.concat([{ category = b.service_category; count }]);
      };
    };
    result
  };
};