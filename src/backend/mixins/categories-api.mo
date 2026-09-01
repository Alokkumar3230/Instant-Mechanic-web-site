import Map "mo:core/Map";
import Types "../types/common";
import CategoriesLib "../lib/categories";

mixin (serviceCategories : Map.Map<Nat, Types.ServiceCategory>) {
  public query func listServiceCategories() : async [Types.ServiceCategory] {
    CategoriesLib.listServiceCategories(serviceCategories)
  };
};