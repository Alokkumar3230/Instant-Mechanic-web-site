import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/common";

module {
  public func listServiceCategories(
    serviceCategories : Map.Map<Nat, Types.ServiceCategory>
  ) : [Types.ServiceCategory] {
    serviceCategories.values().toArray().sort(func (a, b) = Nat.compare(a.id, b.id))
  };
};