import Map "mo:core/Map";
import Types "../types/common";

module {
  let dayNs : Int = 86_400_000_000_000;

  func isSameDay(a : Types.Timestamp, b : Types.Timestamp) : Bool {
    a / dayNs == b / dayNs
  };

  public func getDashboardStats(
    bookings : Map.Map<Nat, Types.Booking>,
    customers : Map.Map<Nat, Types.Customer>,
    mechanics : Map.Map<Nat, Types.Mechanic>,
    now : Types.Timestamp
  ) : Types.DashboardStats {
    var totalBookings = 0;
    var todayBookings = 0;
    var completed = 0;
    var pending = 0;
    var cancelled = 0;
    var totalRevenue = 0;

    for (b in bookings.values()) {
      totalBookings += 1;
      if (isSameDay(b.scheduled_at, now)) { todayBookings += 1 };
      switch (b.status) {
        case (#completed) { completed += 1; totalRevenue += b.amount };
        case (#pending) { pending += 1 };
        case (#cancelled) { cancelled += 1 };
        case (_) {};
      };
    };

    var activeMechanics = 0;
    for (m in mechanics.values()) {
      if (m.status != #offline) { activeMechanics += 1 };
    };

    var newCustomers30d = 0;
    let cutoff30 = now - 30 * dayNs;
    for (c in customers.values()) {
      if (c.created_at >= cutoff30) { newCustomers30d += 1 };
    };

    {
      total_bookings = totalBookings;
      today_bookings = todayBookings;
      completed;
      pending;
      cancelled;
      total_revenue = totalRevenue;
      active_mechanics = activeMechanics;
      new_customers_30d = newCustomers30d;
    }
  };
};
