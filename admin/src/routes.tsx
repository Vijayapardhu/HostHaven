import { Suspense, lazy, ElementType } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import {
  AdminLayout,
  AuthLayout,
  BlankLayout,
} from "./components/layout/Layouts";
import {
  ProtectedRoute,
  GuestRoute,
  PermissionGuard,
} from "./components/ProtectedRoute";
import LoadingPage from "./pages/LoadingPage";
import ErrorPage from "./pages/ErrorPage";

const Loading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const PageLoader =
  (Component: ElementType) => (props: Record<string, unknown>) => (
    <Suspense fallback={<Loading />}>
      <Component {...props} />
    </Suspense>
  );

const Dashboard = PageLoader(lazy(() => import("./pages/Dashboard")));
const Bookings = PageLoader(lazy(() => import("./pages/Bookings")));
const BookingDetails = PageLoader(lazy(() => import("./pages/BookingDetails")));
const Properties = PageLoader(lazy(() => import("./pages/Properties")));
const PropertyDetails = PageLoader(
  lazy(() => import("./pages/PropertyDetails")),
);
const AddProperty = PageLoader(lazy(() => import("./pages/AddProperty")));
const AddHotel = PageLoader(lazy(() => import("./pages/AddHotel")));
const AddHouse = PageLoader(lazy(() => import("./pages/AddHouse")));
const PropertyApproval = PageLoader(
  lazy(() => import("./pages/PropertyApproval")),
);
const Vendors = PageLoader(lazy(() => import("./pages/Vendors")));
const AddVendorOnboarding = PageLoader(
  lazy(() => import("./pages/AddVendorOnboarding")),
);
const VendorDetails = PageLoader(lazy(() => import("./pages/VendorDetails")));
const VendorApproval = PageLoader(lazy(() => import("./pages/VendorApproval")));
const Users = PageLoader(lazy(() => import("./pages/Users")));
const UserDetails = PageLoader(lazy(() => import("./pages/UserDetails")));
const Payments = PageLoader(lazy(() => import("./pages/Payments")));
const VendorEarnings = PageLoader(lazy(() => import("./pages/VendorEarnings")));
const RoomInventoryControl = PageLoader(
  lazy(() => import("./pages/RoomInventoryControl")),
);
const Services = PageLoader(lazy(() => import("./pages/Services")));
const ServiceDetails = PageLoader(lazy(() => import("./pages/ServiceDetails")));
const AddService = PageLoader(lazy(() => import("./pages/AddService")));
const Reviews = PageLoader(lazy(() => import("./pages/Reviews")));
const Notifications = PageLoader(lazy(() => import("./pages/Notifications")));
const Analytics = PageLoader(lazy(() => import("./pages/Analytics")));
const Settings = PageLoader(lazy(() => import("./pages/Settings")));
const Support = PageLoader(lazy(() => import("./pages/Support")));
const Inventory = PageLoader(lazy(() => import("./pages/Inventory")));
const AdminLogin = PageLoader(lazy(() => import("./pages/AdminLogin")));
const Temples = PageLoader(lazy(() => import("./pages/Temples")));
const TempleDetails = PageLoader(lazy(() => import("./pages/TempleDetails")));
const AddTemple = PageLoader(lazy(() => import("./pages/AddTemple")));
const ServiceBookings = PageLoader(
  lazy(() => import("./pages/ServiceBookings")),
);
const ServiceBookingDetails = PageLoader(
  lazy(() => import("./pages/ServiceBookingDetails")),
);
const Success = PageLoader(lazy(() => import("./pages/Success")));
const SystemControl = PageLoader(lazy(() => import("./pages/SystemControl")));

const routes = [
  {
    element: (
      <ProtectedRoute>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "/",
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "/dashboard",
        element: <Dashboard />,
      },
      {
        path: "/bookings",
        element: <Bookings />,
      },
      {
        path: "/bookings/:id",
        element: <BookingDetails />,
      },
      {
        path: "/properties",
        element: <Properties />,
      },
      {
        path: "/properties/:id",
        element: <PropertyDetails />,
      },
      {
        path: "/properties/approval",
        element: <PropertyApproval />,
      },
      {
        path: "/properties/add",
        element: <AddProperty />,
      },
      {
        path: "/properties/add-hotel",
        element: <AddHotel />,
      },
      {
        path: "/properties/add-house",
        element: <AddHouse />,
      },
      {
        path: "/properties/:id/edit",
        element: <AddProperty />,
      },
      {
        path: "/vendors",
        element: <Vendors />,
      },
      {
        path: "/vendors/onboarding/new",
        element: <AddVendorOnboarding />,
      },
      {
        path: "/vendors/:id",
        element: <VendorDetails />,
      },
      {
        path: "/vendors/approval",
        element: <VendorApproval />,
      },
      {
        path: "/users",
        element: <Users />,
      },
      {
        path: "/users/:id",
        element: <UserDetails />,
      },
      {
        path: "/payments",
        element: <Payments />,
      },
      {
        path: "/finance/earnings",
        element: <VendorEarnings />,
      },
      {
        path: "/rooms/:roomId/inventory",
        element: <RoomInventoryControl />,
      },
      {
        path: "/services",
        element: <Services />,
      },
      {
        path: "/services/add",
        element: <AddService />,
      },
      {
        path: "/services/:id",
        element: <ServiceDetails />,
      },
      {
        path: "/services/:id/edit",
        element: <AddService />,
      },
      {
        path: "/reviews",
        element: <Reviews />,
      },
      {
        path: "/notifications",
        element: <Notifications />,
      },
      {
        path: "/analytics",
        element: <Analytics />,
      },
      {
        path: "/settings",
        element: <Settings />,
      },
      {
        path: "/system",
        element: <SystemControl />,
      },
      {
        path: "/support",
        element: <Support />,
      },
      {
        path: "/inventory",
        element: <Inventory />,
      },
      {
        path: "/temples",
        element: <Temples />,
      },
      {
        path: "/temples/:id",
        element: <TempleDetails />,
      },
      {
        path: "/temples/new",
        element: <AddTemple />,
      },
      {
        path: "/temples/:id/edit",
        element: <AddTemple />,
      },
      {
        path: "/service-bookings",
        element: <ServiceBookings />,
      },
      {
        path: "/service-bookings/:id",
        element: <ServiceBookingDetails />,
      },
    ],
  },
  {
    element: (
      <GuestRoute>
        <AuthLayout />
      </GuestRoute>
    ),
    children: [
      {
        path: "/auth/login",
        element: <AdminLogin />,
      },
      {
        path: "/success",
        element: <Success />,
      },
    ],
  },
  {
    element: <BlankLayout />,
    children: [
      {
        path: "/unauthorized",
        element: (
          <ErrorPage
            code="403"
            message="You don't have permission to access this page"
          />
        ),
      },
      {
        path: "/404",
        element: <ErrorPage code="404" message="Page not found" />,
      },
      {
        path: "*",
        element: <ErrorPage code="404" message="Page not found" />,
      },
    ],
  },
];

export function AppRoutes() {
  const element = useRoutes(routes);
  return element || null;
}

export default routes;
