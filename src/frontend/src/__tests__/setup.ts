import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { type ReactNode, createElement } from "react";
import { afterEach, vi } from "vitest";

// The generated components use `data-ocid` as their test id attribute.
configure({ testIdAttribute: "data-ocid" });

// RTL's auto-cleanup needs a global afterEach; vitest runs without globals here.
afterEach(() => cleanup());

// The app's main.tsx patches BigInt.prototype.toJSON so TanStack Query can
// hash query keys that contain bigint values (page/limit/ids). Tests render
// pages directly without main.tsx, so replicate the patch here.
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// jsdom lacks matchMedia; next-themes and recharts consult it.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom lacks pointer capture; @radix-ui/react-select calls these on the
// trigger when opening a select, and without them the status-filter test dies
// with "target.hasPointerCapture is not a function".
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
}

// jsdom lacks scrollIntoView; @radix-ui/react-select calls it on the focused
// option when a select opens, and without it the status-filter test dies with
// "candidate?.scrollIntoView is not a function".
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

// recharts' ResponsiveContainer observes element size.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  ResizeObserverMock as unknown as typeof ResizeObserver;

/**
 * Typed local actor mock shared by every frontend test. The real `useQueries`
 * hooks run against this object, so query keys, data flow, and page rendering
 * are exercised; only the canister boundary is mocked.
 */
export const mockActor = {
  getDashboardStats: vi.fn(),
  listBookings: vi.fn(),
  getBooking: vi.fn(),
  listMechanics: vi.fn(),
  getMechanic: vi.fn(),
  listCustomers: vi.fn(),
  getCustomer: vi.fn(),
  listServiceCategories: vi.fn(),
  getBookingsOverTime: vi.fn(),
  getRevenueOverTime: vi.fn(),
  getStatusBreakdown: vi.fn(),
  getCategoryBreakdown: vi.fn(),
  updateBookingStatus: vi.fn(),
  seedDemoData: vi.fn(),
  simulatorTick: vi.fn(),
  getApiDoc: vi.fn(),
};

/** Mutable Internet Identity state the mock reads on every render. */
export const mockIdentityState = {
  isAuthenticated: true,
  isInitializing: false,
  identity: undefined as
    | { getPrincipal: () => { toString: () => string } }
    | undefined,
};

/** Mutable router state the mock reads on every render. */
export const mockRouterState = {
  navigate: vi.fn(),
  params: {} as Record<string, string>,
  pathname: "/",
};

vi.mock("@caffeineai/core-infrastructure", () => ({
  useActor: () => ({ actor: mockActor, isFetching: false }),
  useInternetIdentity: () => ({
    identity: mockIdentityState.identity,
    login: vi.fn(),
    clear: vi.fn(),
    loginStatus: "success",
    isInitializing: mockIdentityState.isInitializing,
    isLoginIdle: false,
    isLoggingIn: false,
    isLoginSuccess: false,
    isLoginError: false,
    isAuthenticated: mockIdentityState.isAuthenticated,
    loginError: undefined,
  }),
  InternetIdentityProvider: ({ children }: { children: ReactNode }) => children,
}));

// The generated `@/backend` re-exports ExternalBlob from this package, whose
// installed dist is missing subpath files. Tests never touch blobs, so a stub
// export is enough to let the module graph load.
vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: class ExternalBlob {},
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockRouterState.navigate,
  useParams: () => mockRouterState.params,
  useLocation: () => ({ pathname: mockRouterState.pathname }),
  Link: ({
    to,
    params: _params,
    children,
    ...props
  }: {
    to: string;
    params?: Record<string, string>;
    children?: ReactNode;
  }) =>
    createElement(
      "a",
      { href: typeof to === "string" ? to : "/", ...props },
      children,
    ),
  Outlet: () => null,
}));
