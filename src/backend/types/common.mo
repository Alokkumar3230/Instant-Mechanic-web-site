module {
  public type Timestamp = Int;

  public type BookingStatus = {
    #pending;
    #assigned;
    #on_the_way;
    #in_progress;
    #completed;
    #cancelled;
  };

  public type MechanicStatus = {
    #available;
    #busy;
    #offline;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    email : Text;
    phone : Text;
    created_at : Timestamp;
  };

  public type Mechanic = {
    id : Nat;
    name : Text;
    status : MechanicStatus;
    specialty : Text;
    jobs_completed : Nat;
    current_booking_id : ?Nat;
    created_at : Timestamp;
  };

  public type Booking = {
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

  public type ServiceCategory = {
    id : Nat;
    name : Text;
  };

  public type AppState = {
    var nextCustomerId : Nat;
    var nextMechanicId : Nat;
    var nextBookingId : Nat;
    var nextCategoryId : Nat;
    var lastSimulatorTick : Timestamp;
  };

  public type DashboardStats = {
    total_bookings : Nat;
    today_bookings : Nat;
    completed : Nat;
    pending : Nat;
    cancelled : Nat;
    total_revenue : Nat;
    active_mechanics : Nat;
    new_customers_30d : Nat;
  };

  public type BookingFilter = {
    status : ?BookingStatus;
    customer_id : ?Nat;
    mechanic_id : ?Nat;
    service_category : ?Text;
    date_from : ?Timestamp;
    date_to : ?Timestamp;
    search : ?Text;
    sort_by : ?Text;
    sort_desc : Bool;
    page : Nat;
    limit : Nat;
  };

  public type BookingPage = {
    items : [Booking];
    total : Nat;
    page : Nat;
    limit : Nat;
  };

  public type MechanicFilter = {
    status : ?MechanicStatus;
    search : ?Text;
    page : Nat;
    limit : Nat;
  };

  public type MechanicPage = {
    items : [Mechanic];
    total : Nat;
    page : Nat;
    limit : Nat;
  };

  public type CustomerFilter = {
    search : ?Text;
    page : Nat;
    limit : Nat;
  };

  public type CustomerPage = {
    items : [Customer];
    total : Nat;
    page : Nat;
    limit : Nat;
  };

  public type AnalyticsPoint = {
    period : Text;
    value : Nat;
  };

  public type StatusBreakdown = {
    status : Text;
    count : Nat;
  };

  public type CategoryBreakdown = {
    category : Text;
    count : Nat;
  };
};