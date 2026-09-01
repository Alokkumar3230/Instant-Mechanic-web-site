import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Order "mo:core/Order";
import Types "../types/common";

module {
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

  func matchesSearch(customers : Map.Map<Nat, Types.Customer>, b : Types.Booking, term : Text) : Bool {
    let t = term.toLower();
    let customerName = switch (customers.get(b.customer_id)) {
      case (?c) { c.name.toLower() };
      case null { "" };
    };
    customerName.contains(#text t)
      or b.vehicle_make.toLower().contains(#text t)
      or b.vehicle_model.toLower().contains(#text t)
      or b.service_category.toLower().contains(#text t)
      or b.service_description.toLower().contains(#text t)
      or b.id.toText().contains(#text t)
  };

  func compareBy(key : Text, a : Types.Booking, b : Types.Booking) : Order.Order {
    switch (key) {
      case ("id") { Nat.compare(a.id, b.id) };
      case ("amount") { Nat.compare(a.amount, b.amount) };
      case ("created_at") { Int.compare(a.created_at, b.created_at) };
      case (_) { Int.compare(a.scheduled_at, b.scheduled_at) };
    }
  };

  func isValidTransition(from : Types.BookingStatus, to : Types.BookingStatus) : Bool {
    switch (from) {
      case (#pending) { to == #assigned or to == #cancelled };
      case (#assigned) { to == #on_the_way or to == #cancelled };
      case (#on_the_way) { to == #in_progress or to == #cancelled };
      case (#in_progress) { to == #completed or to == #cancelled };
      case (#completed) { false };
      case (#cancelled) { false };
    }
  };

  public func listBookings(
    bookings : Map.Map<Nat, Types.Booking>,
    customers : Map.Map<Nat, Types.Customer>,
    filter : Types.BookingFilter
  ) : Types.BookingPage {
    var filtered = bookings.values().toArray();

    switch (filter.status) {
      case (?s) { filtered := filtered.filter(func b = b.status == s) };
      case null {};
    };
    switch (filter.customer_id) {
      case (?cid) { filtered := filtered.filter(func b = b.customer_id == cid) };
      case null {};
    };
    switch (filter.mechanic_id) {
      case (?mid) { filtered := filtered.filter(func b = b.mechanic_id == ?mid) };
      case null {};
    };
    switch (filter.service_category) {
      case (?cat) { filtered := filtered.filter(func b = b.service_category == cat) };
      case null {};
    };
    switch (filter.date_from) {
      case (?d) { filtered := filtered.filter(func b = b.scheduled_at >= d) };
      case null {};
    };
    switch (filter.date_to) {
      case (?d) { filtered := filtered.filter(func b = b.scheduled_at <= d) };
      case null {};
    };
    switch (filter.search) {
      case (?term) { filtered := filtered.filter(func b = matchesSearch(customers, b, term)) };
      case null {};
    };

    let sortKey = filter.sort_by ?? "scheduled_at";
    let desc = filter.sort_desc;
    let sorted = filtered.sort(func (a, b) {
      let c = compareBy(sortKey, a, b);
      if (desc) {
        switch (c) {
          case (#less) { #greater };
          case (#greater) { #less };
          case (#equal) { #equal };
        }
      } else {
        c
      }
    });

    let total = sorted.size();
    let page = filter.page;
    let limit = filter.limit;
    let start = page * limit;
    let end = if (start + limit > total) { total } else { start + limit };
    let items = if (start >= total) { [] } else { sorted.sliceToArray(start.toInt(), end.toInt()) };

    { items; total; page; limit }
  };

  public func getBooking(
    bookings : Map.Map<Nat, Types.Booking>,
    id : Nat
  ) : ?Types.Booking {
    bookings.get(id)
  };

  public func updateBookingStatus(
    bookings : Map.Map<Nat, Types.Booking>,
    mechanics : Map.Map<Nat, Types.Mechanic>,
    id : Nat,
    status : Types.BookingStatus,
    now : Types.Timestamp
  ) : ?Types.Booking {
    switch (bookings.get(id)) {
      case null { null };
      case (?b) {
        if (not isValidTransition(b.status, status)) {
          ?b
        } else {
          let updated = { b with status; updated_at = now };
          bookings.add(id, updated);
          switch (b.mechanic_id) {
            case (?mid) {
              switch (mechanics.get(mid)) {
                case (?m) {
                  let newM = if (status == #completed) {
                    { m with status = #available; jobs_completed = m.jobs_completed + 1; current_booking_id = null }
                  } else if (status == #cancelled) {
                    { m with status = #available; current_booking_id = null }
                  } else {
                    { m with status = #busy; current_booking_id = ?id }
                  };
                  mechanics.add(mid, newM);
                };
                case null {};
              };
            };
            case null {};
          };
          ?updated
        };
      };
    }
  };
};
