import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Types "../types/common";

module {
  let dayNs : Int = 86_400_000_000_000;

  // 2^64 — masks the LCG state to a fixed 64-bit width after every step so the
  // seed never grows unboundedly across the ~7200 rand calls in seedDemoData.
  // Without this, the seed grows ~64 bits per iteration and the single update
  // call exceeds the IC instruction limit on the real canister.
  let mask64 : Nat = 18446744073709551616;

  func rand(seed : Nat) : (Nat, Nat) {
    let next = (seed * 6364136223846793005 + 1442695040888963407) % mask64;
    (next, next)
  };

  func randNat(seed : Nat, max : Nat) : (Nat, Nat) {
    if (max == 0) { (seed, 0) } else {
      let (s, r) = rand(seed);
      (s, r % max)
    }
  };

  func pick<T>(seed : Nat, arr : [T]) : (Nat, T) {
    let (s, i) = randNat(seed, arr.size());
    (s, arr[i])
  };

  func advance(
    bookings : Map.Map<Nat, Types.Booking>,
    mechanics : Map.Map<Nat, Types.Mechanic>,
    b : Types.Booking,
    now : Types.Timestamp,
    seed : Nat
  ) : Nat {
    var s = seed;
    switch (b.status) {
      case (#pending) {
        let (s2, mid) = randNat(s, 20);
        s := s2;
        let updated = { b with status = #assigned; mechanic_id = ?mid; updated_at = now };
        bookings.add(b.id, updated);
        switch (mechanics.get(mid)) {
          case (?m) { mechanics.add(mid, { m with status = #busy; current_booking_id = ?b.id }) };
          case null {};
        };
      };
      case (#assigned) {
        bookings.add(b.id, { b with status = #on_the_way; updated_at = now });
      };
      case (#on_the_way) {
        bookings.add(b.id, { b with status = #in_progress; updated_at = now });
      };
      case (#in_progress) {
        bookings.add(b.id, { b with status = #completed; updated_at = now });
        switch (b.mechanic_id) {
          case (?mid) {
            switch (mechanics.get(mid)) {
              case (?m) {
                mechanics.add(mid, { m with status = #available; jobs_completed = m.jobs_completed + 1; current_booking_id = null });
              };
              case null {};
            };
          };
          case null {};
        };
      };
      case (_) {};
    };
    s
  };

  public func seedDemoData(
    customers : Map.Map<Nat, Types.Customer>,
    mechanics : Map.Map<Nat, Types.Mechanic>,
    bookings : Map.Map<Nat, Types.Booking>,
    serviceCategories : Map.Map<Nat, Types.ServiceCategory>,
    state : Types.AppState,
    now : Types.Timestamp
  ) : () {
    if (bookings.size() > 0) { return };
    var seed : Nat = 0x9E3779B9;

    let catNames = [
      "Oil Change",
      "Brake Repair",
      "Battery Replacement",
      "Diagnostics",
      "Tire Service",
      "AC Repair",
      "Engine Tune-Up",
      "Transmission Service",
    ];

    var catId = state.nextCategoryId;
    for (name in catNames.values()) {
      serviceCategories.add(catId, { id = catId; name });
      catId += 1;
    };
    state.nextCategoryId := catId;

    let firstNames = [
      "James", "Maria", "Robert", "Linda", "Michael", "Susan", "David", "Karen",
      "John", "Lisa", "Carlos", "Aisha", "Tom", "Elena", "Raj", "Sofia",
      "Marcus", "Yuki", "Omar", "Grace", "Victor", "Nina",
    ];
    let lastNames = [
      "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
      "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
      "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
      "Lee", "Perez",
    ];
    let specialties = catNames;

    var mechId = state.nextMechanicId;
    for (i in Nat.range(0, 20)) {
      let (s1, fn) = pick(seed, firstNames);
      seed := s1;
      let (s2, ln) = pick(seed, lastNames);
      seed := s2;
      let name = fn # " " # ln;
      let status = if (i < 5) { #busy } else if (i < 16) { #available } else { #offline };
      let (s3, sp) = pick(seed, specialties);
      seed := s3;
      let (s4, jc) = randNat(seed, 400);
      seed := s4;
      let (s5, age) = randNat(seed, 90);
      seed := s5;
      mechanics.add(mechId, {
        id = mechId;
        name;
        status;
        specialty = sp;
        jobs_completed = jc;
        current_booking_id = null;
        created_at = now - age.toInt() * dayNs;
      });
      mechId += 1;
    };
    state.nextMechanicId := mechId;

    let emailDomains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "proton.me"];
    var custId = state.nextCustomerId;
    for (i in Nat.range(0, 55)) {
      let (s1, fn) = pick(seed, firstNames);
      seed := s1;
      let (s2, ln) = pick(seed, lastNames);
      seed := s2;
      let name = fn # " " # ln;
      let (s3, rn) = randNat(seed, 1000);
      seed := s3;
      let (s4, dom) = pick(seed, emailDomains);
      seed := s4;
      let email = name.toLower().replace(#text " ", "") # rn.toText() # "@" # dom;
      let (s5, ph) = randNat(seed, 900000000);
      seed := s5;
      let (s6, age) = randNat(seed, 90);
      seed := s6;
      customers.add(custId, {
        id = custId;
        name;
        email;
        phone = "+1" # (ph + 100000000).toText();
        created_at = now - age.toInt() * dayNs;
      });
      custId += 1;
    };
    state.nextCustomerId := custId;

    let makes = [
      "Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Mercedes", "Tesla",
      "Nissan", "Hyundai", "Kia", "Audi", "Volkswagen",
    ];
    let models = [
      "Camry", "Civic", "F-150", "Silverado", "3 Series", "C-Class", "Model 3",
      "Altima", "Elantra", "Sportage", "A4", "Golf",
    ];
    let descriptions = [
      "Routine maintenance", "Customer reported issue", "Scheduled service",
      "Inspection requested", "Follow-up visit", "Warranty work",
    ];
    let amounts = [45, 60, 80, 120, 150, 200, 250, 300, 400, 500];

    var bookId = state.nextBookingId;
    for (i in Nat.range(0, 520)) {
      let (s1, ageDays) = randNat(seed, 90);
      seed := s1;
      let (s2, sub) = randNat(seed, dayNs.toNat());
      seed := s2;
      let scheduled = now - ageDays.toInt() * dayNs - sub.toInt();
      let (s3, cd) = randNat(seed, 3);
      seed := s3;
      let created = scheduled - cd.toInt() * dayNs;
      let status = if (ageDays > 30) {
        let (sa, r) = randNat(seed, 10);
        seed := sa;
        if (r < 8) { #completed } else { #cancelled }
      } else if (ageDays > 15) {
        let (sa, r1) = randNat(seed, 10);
        seed := sa;
        if (r1 < 6) { #completed } else {
          let (sb, r2) = randNat(seed, 10);
          seed := sb;
          if (r2 < 3) { #cancelled } else { #in_progress }
        }
      } else if (ageDays > 5) {
        let (sa, r1) = randNat(seed, 10);
        seed := sa;
        if (r1 < 4) { #completed } else {
          let (sb, r2) = randNat(seed, 10);
          seed := sb;
          if (r2 < 2) { #cancelled } else { #assigned }
        }
      } else {
        let (sa, r1) = randNat(seed, 10);
        seed := sa;
        if (r1 < 3) { #pending } else {
          let (sb, r2) = randNat(seed, 10);
          seed := sb;
          if (r2 < 3) { #assigned } else {
            let (sc, r3) = randNat(seed, 10);
            seed := sc;
            if (r3 < 3) { #on_the_way } else { #in_progress }
          }
        }
      };
      let mechanicId = if (status == #pending) { null } else {
        let (sm, mid) = randNat(seed, 20);
        seed := sm;
        ?mid
      };
      let (s4, mk) = pick(seed, makes);
      seed := s4;
      let (s5, md) = pick(seed, models);
      seed := s5;
      let (s6, cat) = pick(seed, catNames);
      seed := s6;
      let (s7, desc) = pick(seed, descriptions);
      seed := s7;
      let (s8, amt) = pick(seed, amounts);
      seed := s8;
      let (s9, cid) = randNat(seed, 55);
      seed := s9;
      bookings.add(bookId, {
        id = bookId;
        customer_id = cid;
        mechanic_id = mechanicId;
        vehicle_make = mk;
        vehicle_model = md;
        service_category = cat;
        service_description = desc;
        status;
        amount = amt;
        scheduled_at = scheduled;
        created_at = created;
        updated_at = scheduled;
      });
      bookId += 1;
    };
    state.nextBookingId := bookId;
    state.lastSimulatorTick := now;
  };

  public func simulatorTick(
    bookings : Map.Map<Nat, Types.Booking>,
    mechanics : Map.Map<Nat, Types.Mechanic>,
    state : Types.AppState,
    now : Types.Timestamp
  ) : () {
    var candidates : [Types.Booking] = [];
    for (b in bookings.values()) {
      if (candidates.size() >= 3) { break };
      switch (b.status) {
        case (#pending) { candidates := candidates.concat([b]) };
        case (#assigned) { candidates := candidates.concat([b]) };
        case (#on_the_way) { candidates := candidates.concat([b]) };
        case (#in_progress) { candidates := candidates.concat([b]) };
        case (_) {};
      };
    };
    var seed : Nat = 0;
    for (b in candidates.values()) {
      seed := advance(bookings, mechanics, b, now, seed);
    };
    state.lastSimulatorTick := now;
  };
};
