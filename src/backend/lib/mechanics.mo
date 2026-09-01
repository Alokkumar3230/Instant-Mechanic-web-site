import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types/common";

module {
  public func listMechanics(
    mechanics : Map.Map<Nat, Types.Mechanic>,
    filter : Types.MechanicFilter
  ) : Types.MechanicPage {
    var filtered = mechanics.values().toArray();

    switch (filter.status) {
      case (?s) { filtered := filtered.filter(func m = m.status == s) };
      case null {};
    };
    switch (filter.search) {
      case (?term) {
        let t = term.toLower();
        filtered := filtered.filter(func m =
          m.name.toLower().contains(#text t) or m.specialty.toLower().contains(#text t));
      };
      case null {};
    };

    let sorted = filtered.sort(func (a, b) = Nat.compare(a.id, b.id));
    let total = sorted.size();
    let page = filter.page;
    let limit = filter.limit;
    let start = page * limit;
    let end = if (start + limit > total) { total } else { start + limit };
    let items = if (start >= total) { [] } else { sorted.sliceToArray(start.toInt(), end.toInt()) };

    { items; total; page; limit }
  };

  public func getMechanic(
    mechanics : Map.Map<Nat, Types.Mechanic>,
    id : Nat
  ) : ?Types.Mechanic {
    mechanics.get(id)
  };
};