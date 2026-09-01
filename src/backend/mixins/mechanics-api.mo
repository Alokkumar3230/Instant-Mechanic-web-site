import Map "mo:core/Map";
import Types "../types/common";
import MechanicsLib "../lib/mechanics";

mixin (mechanics : Map.Map<Nat, Types.Mechanic>) {
  public query func listMechanics(filter : Types.MechanicFilter) : async Types.MechanicPage {
    MechanicsLib.listMechanics(mechanics, filter)
  };

  public query func getMechanic(id : Nat) : async ?Types.Mechanic {
    MechanicsLib.getMechanic(mechanics, id)
  };
};