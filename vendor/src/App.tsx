import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { VendorProvider } from "@/contexts/VendorContext";
import VendorProtectedRoute from "@/components/guards/VendorProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import VendorLayout from "@/pages/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorProperties from "@/pages/vendor/VendorProperties";
import VendorRooms from "@/pages/vendor/VendorRooms/index";
import VendorHotel from "@/pages/vendor/VendorHotel";
import AddRoom from "@/pages/vendor/VendorRooms/AddRoom";
import EditRoom from "@/pages/vendor/VendorRooms/EditRoom";
import VendorBookings from "@/pages/vendor/VendorBookings/index";
import VendorReviews from "@/pages/vendor/VendorReviews/index";
import VendorEarnings from "@/pages/vendor/VendorEarnings/index";
import PayoutHistory from "@/pages/vendor/VendorEarnings/PayoutHistory";
import VendorSettings from "@/pages/vendor/VendorSettings";
import VendorPOS from "@/pages/vendor/VendorPOS";
import VendorNotifications from "@/pages/vendor/VendorNotifications/index";
import VendorBookingDetail from "@/pages/vendor/VendorBookings/BookingDetail";
import VendorPropertyDetail from "@/pages/vendor/VendorPropertyDetail";
import VendorRoomDetail from "@/pages/vendor/VendorRoomDetail";
import VendorCalendar from "@/pages/vendor/VendorCalendar/index";
import BlockDates from "@/pages/vendor/VendorCalendar/BlockDates";
import VendorInventory from "@/pages/vendor/VendorInventory/index";
import VendorPOSHistory from "@/pages/vendor/VendorPOSHistory";
import VendorReports from "@/pages/vendor/VendorReports";
import VendorSupport from "@/pages/vendor/VendorSupport/index";
import VendorLogin from "@/pages/VendorLogin";
import VendorForgotPassword from "@/pages/VendorForgotPassword";
import VendorResetPassword from "@/pages/VendorResetPassword";
import VendorSignup from "@/pages/VendorSignup";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <VendorProvider>
        <BrowserRouter>
          <ScrollToTop />
          <PWAInstallPrompt />
          <Routes>
            <Route path="/" element={<Navigate to="/vendor/dashboard" replace />} />
            <Route path="/login" element={<VendorLogin />} />
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/signup" element={<VendorSignup />} />
            <Route path="/vendor/signup" element={<VendorSignup />} />
            <Route path="/forgot-password" element={<VendorForgotPassword />} />
            <Route
              path="/vendor/forgot-password"
              element={<VendorForgotPassword />}
            />
            <Route path="/reset-password" element={<VendorResetPassword />} />
            <Route
              path="/vendor/reset-password"
              element={<VendorResetPassword />}
            />

            <Route path="/vendor" element={<VendorProtectedRoute />}>
              <Route element={<VendorLayout />}>
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="pos" element={<VendorPOS />} />
                <Route path="pos/history" element={<VendorPOSHistory />} />
                <Route path="hotel" element={<VendorHotel />} />
                <Route path="properties" element={<VendorProperties />} />
                <Route
                  path="properties/:id"
                  element={<VendorPropertyDetail />}
                />
                <Route path="properties/:id/rooms" element={<VendorRooms />} />
                <Route path="rooms" element={<VendorRooms />} />
                <Route path="rooms/add" element={<AddRoom />} />
                <Route path="rooms/:id/edit" element={<EditRoom />} />
                <Route path="rooms/:id" element={<VendorRoomDetail />} />
                <Route path="bookings" element={<VendorBookings />} />
                <Route path="bookings/:id" element={<VendorBookingDetail />} />
                <Route path="calendar" element={<VendorCalendar />} />
                <Route path="calendar/block-dates" element={<BlockDates />} />
                <Route path="inventory" element={<VendorInventory />} />
                <Route path="reports" element={<VendorReports />} />
                <Route path="support" element={<VendorSupport />} />
                <Route path="notifications" element={<VendorNotifications />} />
                <Route path="reviews" element={<VendorReviews />} />
                <Route path="earnings" element={<VendorEarnings />} />
                <Route
                  path="earnings/payout-history"
                  element={<PayoutHistory />}
                />
                <Route path="settings" element={<VendorSettings />} />
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
