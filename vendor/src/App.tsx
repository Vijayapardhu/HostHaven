import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VendorProvider } from "@/contexts/VendorContext";
import ScrollToTop from "@/components/ScrollToTop";
import VendorLayout from "@/pages/vendor/VendorLayout";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorProperties from "@/pages/vendor/VendorProperties";
import VendorRooms from "@/pages/vendor/VendorRooms";
import VendorBookings from "@/pages/vendor/VendorBookings";
import VendorReviews from "@/pages/vendor/VendorReviews";
import VendorEarnings from "@/pages/vendor/VendorEarnings";
import VendorSettings from "@/pages/vendor/VendorSettings";
import VendorPOS from "@/pages/vendor/VendorPOS";
import VendorNotifications from "@/pages/vendor/VendorNotifications";
import VendorBookingDetail from "@/pages/vendor/VendorBookingDetail";
import VendorPropertyDetail from "@/pages/vendor/VendorPropertyDetail";
import VendorRoomDetail from "@/pages/vendor/VendorRoomDetail";
import VendorCalendar from "@/pages/vendor/VendorCalendar";
import VendorPOSHistory from "@/pages/vendor/VendorPOSHistory";
import VendorReports from "@/pages/vendor/VendorReports";
import VendorSupport from "@/pages/vendor/VendorSupport";
import VendorLogin from "@/pages/VendorLogin";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/vendor/login" element={<VendorLogin />} />
          
          <Route path="/vendor" element={<VendorProvider><VendorLayout /></VendorProvider>}>
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="pos" element={<VendorPOS />} />
            <Route path="pos/history" element={<VendorPOSHistory />} />
            <Route path="properties" element={<VendorProperties />} />
            <Route path="properties/:id" element={<VendorPropertyDetail />} />
            <Route path="properties/:id/rooms" element={<VendorRooms />} />
            <Route path="rooms" element={<VendorRooms />} />
            <Route path="rooms/:id" element={<VendorRoomDetail />} />
            <Route path="bookings" element={<VendorBookings />} />
            <Route path="bookings/:id" element={<VendorBookingDetail />} />
            <Route path="calendar" element={<VendorCalendar />} />
            <Route path="reports" element={<VendorReports />} />
            <Route path="support" element={<VendorSupport />} />
            <Route path="notifications" element={<VendorNotifications />} />
            <Route path="reviews" element={<VendorReviews />} />
            <Route path="earnings" element={<VendorEarnings />} />
            <Route path="settings" element={<VendorSettings />} />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
