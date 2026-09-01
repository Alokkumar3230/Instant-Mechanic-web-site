import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  type UserRole = {
    #admin;
    #user;
    #guest;
  };

  type AccessControlState = {
    var adminAssigned : Bool;
    userRoles : Map.Map<Principal, UserRole>;
  };

  type Timestamp = Int;

  type BookingStatus = {
    #pending;
    #assigned;
    #on_the_way;
    #in_progress;
    #completed;
    #cancelled;
  };

  type MechanicStatus = {
    #available;
    #busy;
    #offline;
  };

  type Customer = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    created_at : Timestamp;
  };

  type Mechanic = {
    id : Nat;
    name : Text;
    status : MechanicStatus;
    specialty : Text;
    jobs_completed : Nat;
    current_booking_id : ?Nat;
    created_at : Timestamp;
  };

  type Booking = {
    id : Nat;
    customer_id : Nat;
    mechanic_id : ?Nat;
    vehicle_make : Text;
    vehicle_model : Text;
    service_category : Text;
    service_description : Text;
    status : BookingStatus;
    amount : Nat;
    scheduled_at : Timestamp;
    created_at : Timestamp;
    updated_at : Timestamp;
  };

  type ServiceCategory = {
    id : Nat;
    name : Text;
  };

  type AppState = {
    var nextCustomerId : Nat;
    var nextMechanicId : Nat;
    var nextBookingId : Nat;
    var nextCategoryId : Nat;
    var lastSimulatorTick : Timestamp;
  };

  type OldActor = {};

  type NewActor = {
    accessControlState : AccessControlState;
    customers : Map.Map<Nat, Customer>;
    mechanics : Map.Map<Nat, Mechanic>;
    bookings : Map.Map<Nat, Booking>;
    serviceCategories : Map.Map<Nat, ServiceCategory>;
    state : AppState;
  };

  public func migration(old : OldActor) : NewActor {
    ignore old;
    {
      accessControlState = {
        var adminAssigned = false;
        userRoles = Map.empty();
      };
      customers = Map.empty();
      mechanics = Map.empty();
      bookings = Map.empty();
      serviceCategories = Map.empty();
      state = {
        var nextCustomerId = 0;
        var nextMechanicId = 0;
        var nextBookingId = 0;
        var nextCategoryId = 0;
        var lastSimulatorTick = 0;
      };
    };
  };
};