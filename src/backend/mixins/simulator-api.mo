import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/common";
import SimulatorLib "../lib/simulator";

mixin (
  customers : Map.Map<Nat, Types.Customer>,
  mechanics : Map.Map<Nat, Types.Mechanic>,
  bookings : Map.Map<Nat, Types.Booking>,
  serviceCategories : Map.Map<Nat, Types.ServiceCategory>,
  state : Types.AppState
) {
  public shared ({ caller }) func seedDemoData() : async () {
    ignore caller;
    SimulatorLib.seedDemoData(customers, mechanics, bookings, serviceCategories, state, Time.now())
  };

  public shared ({ caller }) func simulatorTick() : async () {
    ignore caller;
    SimulatorLib.simulatorTick(bookings, mechanics, state, Time.now())
  };
};