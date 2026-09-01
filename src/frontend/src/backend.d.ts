import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Timestamp = bigint;
export interface CustomerFilter {
    page: bigint;
    search?: string;
    limit: bigint;
}
export type Result__1 = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "err";
    err: Error_;
};
export type Error_ = {
    __kind__: "FrontendOriginsNotConfigured";
    FrontendOriginsNotConfigured: null;
} | {
    __kind__: "MixedSsoSources";
    MixedSsoSources: {
        otherKeys: Array<string>;
        ssoKeys: Array<string>;
    };
} | {
    __kind__: "Stale";
    Stale: {
        ageNs: bigint;
    };
} | {
    __kind__: "MalformedCandid";
    MalformedCandid: null;
} | {
    __kind__: "AmbiguousAttribute";
    AmbiguousAttribute: {
        field: string;
        sources: Array<string>;
    };
} | {
    __kind__: "NoAttributes";
    NoAttributes: null;
} | {
    __kind__: "UnknownNonce";
    UnknownNonce: null;
} | {
    __kind__: "UntrustedSsoSource";
    UntrustedSsoSource: {
        domain: string;
    };
} | {
    __kind__: "MissingField";
    MissingField: string;
} | {
    __kind__: "FrontendOriginMismatch";
    FrontendOriginMismatch: {
        got: string;
        expected: Array<string>;
    };
};
export interface MechanicFilter {
    status?: MechanicStatus;
    page: bigint;
    search?: string;
    limit: bigint;
}
export interface BookingPage {
    total: bigint;
    page: bigint;
    limit: bigint;
    items: Array<Booking>;
}
export interface DashboardStats {
    cancelled: bigint;
    pending: bigint;
    completed: bigint;
    today_bookings: bigint;
    active_mechanics: bigint;
    new_customers_30d: bigint;
    total_bookings: bigint;
    total_revenue: bigint;
}
export interface Mechanic {
    id: bigint;
    status: MechanicStatus;
    current_booking_id?: bigint;
    name: string;
    created_at: Timestamp;
    specialty: string;
    jobs_completed: bigint;
}
export interface MechanicPage {
    total: bigint;
    page: bigint;
    limit: bigint;
    items: Array<Mechanic>;
}
export interface Customer {
    id: bigint;
    name: string;
    created_at: Timestamp;
    email: string;
    phone: string;
}
export interface CategoryBreakdown {
    count: bigint;
    category: string;
}
export interface Result {
    hasMore: boolean;
    rows: Array<Array<Cell>>;
}
export interface Cell {
    value: Value;
    name: string;
}
export interface StatusBreakdown {
    status: string;
    count: bigint;
}
export interface BookingFilter {
    sort_by?: string;
    status?: BookingStatus;
    date_to?: Timestamp;
    date_from?: Timestamp;
    page: bigint;
    search?: string;
    sort_desc: boolean;
    limit: bigint;
    customer_id?: bigint;
    service_category?: string;
    mechanic_id?: bigint;
}
export interface CustomerPage {
    total: bigint;
    page: bigint;
    limit: bigint;
    items: Array<Customer>;
}
export interface Booking {
    id: bigint;
    status: BookingStatus;
    updated_at: Timestamp;
    service_description: string;
    created_at: Timestamp;
    vehicle_model: string;
    customer_id: bigint;
    scheduled_at: Timestamp;
    service_category: string;
    vehicle_make: string;
    amount: bigint;
    mechanic_id?: bigint;
}
export type Value = {
    __kind__: "int";
    int: bigint;
} | {
    __kind__: "nat";
    nat: bigint;
} | {
    __kind__: "float";
    float: number;
} | {
    __kind__: "bool";
    bool: boolean;
} | {
    __kind__: "null";
    null: null;
} | {
    __kind__: "text";
    text: string;
};
export interface AnalyticsPoint {
    value: bigint;
    period: string;
}
export interface ServiceCategory {
    id: bigint;
    name: string;
}
export enum BookingStatus {
    assigned = "assigned",
    on_the_way = "on_the_way",
    cancelled = "cancelled",
    pending = "pending",
    in_progress = "in_progress",
    completed = "completed"
}
export enum MechanicStatus {
    busy = "busy",
    available = "available",
    offline = "offline"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    execute(qJson: string): Promise<Result>;
    getApiDoc(): Promise<string>;
    getBooking(id: bigint): Promise<Booking | null>;
    getBookingsOverTime(days: bigint): Promise<Array<AnalyticsPoint>>;
    getCallerUserRole(): Promise<UserRole>;
    getCategoryBreakdown(): Promise<Array<CategoryBreakdown>>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getDashboardStats(): Promise<DashboardStats>;
    getMechanic(id: bigint): Promise<Mechanic | null>;
    getRevenueOverTime(days: bigint): Promise<Array<AnalyticsPoint>>;
    getStatusBreakdown(): Promise<Array<StatusBreakdown>>;
    isCallerAdmin(): Promise<boolean>;
    listBookings(filter: BookingFilter): Promise<BookingPage>;
    listCustomers(filter: CustomerFilter): Promise<CustomerPage>;
    listMechanics(filter: MechanicFilter): Promise<MechanicPage>;
    listServiceCategories(): Promise<Array<ServiceCategory>>;
    schema(): Promise<string>;
    seedDemoData(): Promise<void>;
    simulatorTick(): Promise<void>;
    updateBookingStatus(id: bigint, status: BookingStatus): Promise<Booking | null>;
}
