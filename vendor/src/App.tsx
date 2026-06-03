import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VendorProvider } from "@/contexts/VendorContext";
import VendorProtectedRoute from "@/components/guards/VendorProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import VendorLayout from "@/pages/vendor/VendorLayout";
import LoadingState from "@/components/states/LoadingState";
import VendorLogin from "@/pages/VendorLogin";
import VendorSignup from "@/pages/VendorSignup";
import NotFound from "@/pages/NotFound";

const VendorDashboard = lazy(() => import("@/pages/vendor/VendorDashboard"));
const VendorProperties = lazy(() => import("@/pages/vendor/VendorProperties"));
const VendorPropertyDetail = lazy(() => import("@/pages/vendor/VendorPropertyDetail"));
const VendorPropertyNew = lazy(() => import("@/pages/vendor/VendorPropertyNew"));
const VendorRooms = lazy(() => import("@/pages/vendor/VendorRooms/index"));
const VendorRoomDetail = lazy(() => import("@/pages/vendor/VendorRoomDetail"));
const AddRoom = lazy(() => import("@/pages/vendor/VendorRooms/AddRoom"));
const EditRoom = lazy(() => import("@/pages/vendor/VendorRooms/EditRoom"));
const VendorBookings = lazy(() => import("@/pages/vendor/VendorBookings/index"));
const VendorBookingDetail = lazy(() => import("@/pages/vendor/VendorBookings/BookingDetail"));
const VendorInventory = lazy(() => import("@/pages/vendor/VendorInventory/index"));
const VendorPricing = lazy(() => import("@/pages/vendor/VendorPricing/index"));
const VendorCalendar = lazy(() => import("@/pages/vendor/VendorCalendar/index"));
const BlockDates = lazy(() => import("@/pages/vendor/VendorCalendar/BlockDates"));
const VendorReviews = lazy(() => import("@/pages/vendor/VendorReviews/index"));
const VendorEarnings = lazy(() => import("@/pages/vendor/VendorEarnings/index"));
const VendorPayouts = lazy(() => import("@/pages/vendor/VendorEarnings/PayoutHistory"));
// Analytics removed - functionality merged into Reports
const VendorNotifications = lazy(() => import("@/pages/vendor/VendorNotifications/index"));
const VendorSupport = lazy(() => import("@/pages/vendor/VendorSupport/index"));
const VendorSupportDetail = lazy(() => import("@/pages/vendor/VendorSupport/TicketDetail"));
const VendorSettings = lazy(() => import("@/pages/vendor/VendorSettings"));
const VendorPOS = lazy(() => import("@/pages/vendor/VendorPOS"));
const VendorPOSHistory = lazy(() => import("@/pages/vendor/VendorPOSHistory"));
const VendorReports = lazy(() => import("@/pages/vendor/VendorReports"));
const VendorServiceBookings = lazy(() => import("@/pages/vendor/VendorServiceBookings"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <LoadingState />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <VendorProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/login" element={<VendorLogin />} />
            <Route path="/signup" element={<VendorSignup />} />

            <Route path="/" element={<VendorProtectedRoute />}>
              <Route element={<VendorLayout />}>
                <Route index element={<Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>} />
                <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><VendorDashboard /></Suspense>} />

                {/* Properties */}
                <Route path="properties" element={<Suspense fallback={<PageLoader />}><VendorProperties /></Suspense>} />
                <Route path="properties/new" element={<Suspense fallback={<PageLoader />}><VendorPropertyNew /></Suspense>} />
                <Route path="properties/:id" element={<Suspense fallback={<PageLoader />}><VendorPropertyDetail /></Suspense>} />

                {/* Rooms */}
                <Route path="rooms" element={<Suspense fallback={<PageLoader />}><VendorRooms /></Suspense>} />
                <Route path="rooms/new" element={<Suspense fallback={<PageLoader />}><AddRoom /></Suspense>} />
                <Route path="rooms/:id" element={<Suspense fallback={<PageLoader />}><VendorRoomDetail /></Suspense>} />
                <Route path="rooms/:id/edit" element={<Suspense fallback={<PageLoader />}><EditRoom /></Suspense>} />

                {/* Bookings */}
                <Route path="bookings" element={<Suspense fallback={<PageLoader />}><VendorBookings /></Suspense>} />
                <Route path="bookings/:id" element={<Suspense fallback={<PageLoader />}><VendorBookingDetail /></Suspense>} />

                {/* Service Bookings */}
                <Route path="service-bookings" element={<Suspense fallback={<PageLoader />}><VendorServiceBookings /></Suspense>} />

                {/* Inventory & Pricing */}
                <Route path="inventory" element={<Suspense fallback={<PageLoader />}><VendorInventory /></Suspense>} />
                <Route path="pricing" element={<Suspense fallback={<PageLoader />}><VendorPricing /></Suspense>} />

                {/* Calendar */}
                <Route path="calendar" element={<Suspense fallback={<PageLoader />}><VendorCalendar /></Suspense>} />
                <Route path="calendar/block-dates" element={<Suspense fallback={<PageLoader />}><BlockDates /></Suspense>} />

                {/* Reviews */}
                <Route path="reviews" element={<Suspense fallback={<PageLoader />}><VendorReviews /></Suspense>} />

                {/* Earnings & Payouts */}
                <Route path="earnings" element={<Suspense fallback={<PageLoader />}><VendorEarnings /></Suspense>} />
                <Route path="payouts" element={<Suspense fallback={<PageLoader />}><VendorPayouts /></Suspense>} />

                {/* Analytics removed - functionality merged into Reports */}

                {/* Notifications */}
                <Route path="notifications" element={<Suspense fallback={<PageLoader />}><VendorNotifications /></Suspense>} />

                {/* Support */}
                <Route path="support" element={<Suspense fallback={<PageLoader />}><VendorSupport /></Suspense>} />
                <Route path="support/:ticketId" element={<Suspense fallback={<PageLoader />}><VendorSupportDetail /></Suspense>} />

                {/* Settings */}
                <Route path="settings" element={<Suspense fallback={<PageLoader />}><VendorSettings /></Suspense>} />

                {/* POS */}
                <Route path="pos" element={<Suspense fallback={<PageLoader />}><VendorPOS /></Suspense>} />
                <Route path="pos/history" element={<Suspense fallback={<PageLoader />}><VendorPOSHistory /></Suspense>} />

                {/* Reports */}
                <Route path="reports" element={<Suspense fallback={<PageLoader />}><VendorReports /></Suspense>} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </VendorProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
