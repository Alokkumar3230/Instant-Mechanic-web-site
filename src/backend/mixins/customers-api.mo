import Map "mo:core/Map";
import Types "../types/common";
import CustomersLib "../lib/customers";

mixin (customers : Map.Map<Nat, Types.Customer>) {
  public query func listCustomers(filter : Types.CustomerFilter) : async Types.CustomerPage {
    CustomersLib.listCustomers(customers, filter)
  };

  public query func getCustomer(id : Nat) : async ?Types.Customer {
    CustomersLib.getCustomer(customers, id)
  };
};