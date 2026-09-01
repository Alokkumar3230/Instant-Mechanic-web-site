import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

import { Layout } from "@/components/Layout";
import AnalyticsPage from "@/pages/AnalyticsPage";
import BookingDetailPage from "@/pages/BookingsDetailPage";
import BookingsPage from "@/pages/BookingsPage";
import CustomerDetailPage from "@/pages/CustomersDetailPage";
import CustomersPage from "@/pages/CustomersPage";
import MechanicDetailPage from "@/pages/MechanicsDetailPage";
import MechanicsPage from "@/pages/MechanicsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OverviewPage from "@/pages/OverviewPage";

const rootRoute = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: OverviewPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/analytics",
  component: AnalyticsPage,
});

const bookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bookings",
  component: BookingsPage,
});

const bookingDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bookings/$id",
  component: BookingDetailPage,
});

const mechanicsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mechanics",
  component: MechanicsPage,
});

const mechanicDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/mechanics/$id",
  component: MechanicDetailPage,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: CustomersPage,
});

const customerDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers/$id",
  component: CustomerDetailPage,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  component: NotFoundPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  analyticsRoute,
  bookingsRoute,
  bookingDetailRoute,
  mechanicsRoute,
  mechanicDetailRoute,
  customersRoute,
  customerDetailRoute,
  notFoundRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
