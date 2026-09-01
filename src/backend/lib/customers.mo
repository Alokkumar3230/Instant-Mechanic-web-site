import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Types "../types/common";

module {
  public func listCustomers(
    customers : Map.Map<Nat, Types.Customer>,
    filter : Types.CustomerFilter
  ) : Types.CustomerPage {
    var filtered = customers.values().toArray();

    switch (filter.search) {
      case (?term) {
        let t = term.toLower();
        filtered := filtered.filter(func c =
          c.name.toLower().contains(#text t)
            or c.email.toLower().contains(#text t)
            or c.phone.toLower().contains(#text t));
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

  public func getCustomer(
    customers : Map.Map<Nat, Types.Customer>,
    id : Nat
  ) : ?Types.Customer {
    customers.get(id)
  };
};