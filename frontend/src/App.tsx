import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { VendorProvider } from "@/contexts/VendorContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import Index from "./pages/Index";
import Hotels from "./pages/Hotels";
import HotelDetails from "./pages/HotelDetails";
import Homes from "./pages/Homes";
import HomeDetails from "./pages/HomeDetails";
import Temples from "./pages/Temples";
import TempleDetails from "./pages/TempleDetails";
import DeviationTemples from "./pages/DeviationTemples";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import VendorLogin from "./pages/VendorLogin";
import VendorSignup from "./pages/VendorSignup";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import VendorTerms from "./pages/VendorTerms";
import VendorForgotPassword from "./pages/VendorForgotPassword";
import Support from "./pages/Support";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import ReviewsPage from "./pages/ReviewsPage";
import Bookings from "./pages/Bookings";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import VendorLayout from "./pages/vendor/VendorLayout";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProperties from "./pages/vendor/VendorProperties";
import VendorRooms from "./pages/vendor/VendorRooms";
import VendorBookings from "./pages/vendor/VendorBookings";
import VendorReviews from "./pages/vendor/VendorReviews";
import VendorEarnings from "./pages/vendor/VendorEarnings";
import VendorSettings from "./pages/vendor/VendorSettings";
import VendorPOS from "./pages/vendor/VendorPOS";
import VendorNotifications from "./pages/vendor/VendorNotifications";
import VendorBookingDetail from "./pages/vendor/VendorBookingDetail";
import VendorPropertyDetail from "./pages/vendor/VendorPropertyDetail";
import VendorRoomDetail from "./pages/vendor/VendorRoomDetail";
import VendorCalendar from "./pages/vendor/VendorCalendar";
import VendorPOSHistory from "./pages/vendor/VendorPOSHistory";
import VendorReports from "./pages/vendor/VendorReports";
import VendorSupport from "./pages/vendor/VendorSupport";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <WishlistProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <PWAInstallPrompt />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/hotels" element={<Hotels />} />
              <Route path="/hotels/:id" element={<HotelDetails />} />
              <Route path="/homes" element={<Homes />} />
              <Route path="/homes/:id" element={<HomeDetails />} />
              <Route path="/temples" element={<Temples />} />
              <Route path="/temples/:id" element={<TempleDetails />} />
              <Route path="/deviation-temples" element={<DeviationTemples />} />
              <Route path="/services" element={<Services />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/vendor/login" element={<VendorLogin />} />
              <Route path="/vendor/signup" element={<VendorSignup />} />
              <Route path="/vendor/forgot-password" element={<VendorForgotPassword />} />
              <Route path="/vendor-terms" element={<VendorTerms />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<EditProfile />} />
              <Route path="/profile/support" element={<Support />} />
              <Route path="/profile/notifications" element={<Notifications />} />
              <Route path="/profile/security" element={<Security />} />
              <Route path="/profile/settings" element={<Settings />} />
              <Route path="/profile/reviews" element={<ReviewsPage />} />
              <Route path="/bookings" element={<Bookings />} />

              {/* Vendor Protected Routes */}
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
      </WishlistProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
