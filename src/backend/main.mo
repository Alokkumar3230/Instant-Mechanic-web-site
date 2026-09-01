import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import RecordValue "mo:caffeineai-oql/RecordValue";
import NatValue "mo:caffeineai-oql/NatValue";
import TextValue "mo:caffeineai-oql/TextValue";
import IntValue "mo:caffeineai-oql/IntValue";
import Map "mo:core/Map";
import Types "types/common";
import DashboardApi "mixins/dashboard-api";
import BookingsApi "mixins/bookings-api";
import MechanicsApi "mixins/mechanics-api";
import CustomersApi "mixins/customers-api";
import CategoriesApi "mixins/categories-api";
import AnalyticsApi "mixins/analytics-api";
import SimulatorApi "mixins/simulator-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let customers : Map.Map<Nat, Types.Customer>;
  let mechanics : Map.Map<Nat, Types.Mechanic>;
  let bookings : Map.Map<Nat, Types.Booking>;
  let serviceCategories : Map.Map<Nat, Types.ServiceCategory>;
  let state : Types.AppState;

  func mechanicStatusToText(s : Types.MechanicStatus) : Text {
    switch (s) {
      case (#available) "available";
      case (#busy) "busy";
      case (#offline) "offline";
    }
  };

  func bookingStatusToText(s : Types.BookingStatus) : Text {
    switch (s) {
      case (#pending) "pending";
      case (#assigned) "assigned";
      case (#on_the_way) "on_the_way";
      case (#in_progress) "in_progress";
      case (#completed) "completed";
      case (#cancelled) "cancelled";
    }
  };

  func optNatToNat(o : ?Nat) : Nat {
    switch (o) { case (?n) n; case null 0 }
  };

  include MixinAuthorization(accessControlState, null);
  include Expose({
    entities = [
      customers.toEntity("customer", "Customer", "id")
        .sample({ id = 0; name = ""; email = ""; phone = ""; created_at = 0 })
        .controllerOnly()
        .build(),
      serviceCategories.toEntity("serviceCategory", "ServiceCategory", "id")
        .sample({ id = 0; name = "" })
        .controllerOnly()
        .build(),
      mechanics.toEntityManual("mechanic", "Mechanic", "id")
        .sample({ id = 0; name = ""; status = #available; specialty = ""; jobs_completed = 0; current_booking_id = null; created_at = 0 })
        .payload("id", func m = m.id)
        .payload("name", func m = m.name)
        .payload("status", func m = mechanicStatusToText(m.status))
        .payload("specialty", func m = m.specialty)
        .payload("jobs_completed", func m = m.jobs_completed)
        .payload("current_booking_id", func m = optNatToNat(m.current_booking_id))
        .payload("created_at", func m = m.created_at)
        .controllerOnly()
        .build(),
      bookings.toEntityManual("booking", "Booking", "id")
        .sample({ id = 0; customer_id = 0; mechanic_id = null; vehicle_make = ""; vehicle_model = ""; service_category = ""; service_description = ""; status = #pending; amount = 0; scheduled_at = 0; created_at = 0; updated_at = 0 })
        .payload("id", func b = b.id)
        .payload("customer_id", func b = b.customer_id)
        .payload("mechanic_id", func b = optNatToNat(b.mechanic_id))
        .payload("vehicle_make", func b = b.vehicle_make)
        .payload("vehicle_model", func b = b.vehicle_model)
        .payload("service_category", func b = b.service_category)
        .payload("service_description", func b = b.service_description)
        .payload("status", func b = bookingStatusToText(b.status))
        .payload("amount", func b = b.amount)
        .payload("scheduled_at", func b = b.scheduled_at)
        .payload("created_at", func b = b.created_at)
        .payload("updated_at", func b = b.updated_at)
        .controllerOnly()
        .build(),
    ];
  });
  include DashboardApi(bookings, customers, mechanics);
  include BookingsApi(bookings, customers, mechanics);
  include MechanicsApi(mechanics);
  include CustomersApi(customers);
  include CategoriesApi(serviceCategories);
  include AnalyticsApi(bookings);
  include SimulatorApi(customers, mechanics, bookings, serviceCategories, state);
  include ApiDocMixin();
};
