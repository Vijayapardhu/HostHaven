import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { SEOProvider } from "@/contexts/SEOContext";
import Index from "./pages/Index";
import { ThemeInjector } from "./components/ThemeInjector";
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
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AuthCallback from "./pages/AuthCallback";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import SupportRaiseTicket from "./pages/SupportRaiseTicket";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import PaymentMethods from "./pages/PaymentMethods";
import Notifications from "./pages/Notifications";
import Security from "./pages/Security";
import Settings from "./pages/Settings";
import EditProfile from "./pages/EditProfile";
import ReviewsPage from "./pages/ReviewsPage";
import Bookings from "./pages/Bookings";
import BookingFlow from "./pages/BookingFlow";
import BookingReview from "./pages/BookingReview";
import BookingCheckout from "./pages/BookingCheckout";
import BookingProcessing from "./pages/BookingProcessing";
import BookingSuccess from "./pages/BookingSuccess";
import BookingDetails from "./pages/BookingDetails";
import ServiceBookingDetail from "./pages/ServiceBookingDetail";
import Search from "./pages/Search";
import CmsPage from "./pages/CmsPage";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SEOProvider>
      <AuthProvider>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <PWAInstallPrompt />
              <ThemeInjector />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/hotels" element={<Hotels />} />
                <Route path="/hotels-in/:city" element={<Hotels />} />
                <Route path="/hotels/:id" element={<HotelDetails />} />
                <Route path="/homes" element={<Homes />} />
                <Route path="/homes/:id" element={<HomeDetails />} />
                <Route path="/temples" element={<Temples />} />
                <Route path="/temples/:id" element={<TempleDetails />} />
                <Route path="/deviation-temples" element={<DeviationTemples />} />
                <Route path="/services" element={<Services />} />
                <Route path="/search" element={<Search />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/profile/support" element={<Support />} />
                <Route path="/profile/support/raise" element={<SupportRaiseTicket />} />
                <Route path="/profile/support/:id" element={<SupportTicketDetail />} />
                <Route
                  path="/profile/notifications"
                  element={<Notifications />}
                />
                <Route path="/profile/security" element={<Security />} />
                <Route path="/profile/settings" element={<Settings />} />
                <Route path="/profile/reviews" element={<ReviewsPage />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/bookings/:id" element={<BookingDetails />} />
                <Route path="/service-bookings/:id" element={<ServiceBookingDetail />} />
                <Route path="/booking/:id" element={<BookingFlow />} />
                <Route path="/booking/:id/review" element={<BookingReview />} />
                <Route
                  path="/booking/:id/checkout"
                  element={<BookingCheckout />}
                />
                <Route
                  path="/booking/:id/processing"
                  element={<BookingProcessing />}
                />
                <Route path="/booking/:id/success" element={<BookingSuccess />} />
                <Route path="/:slug" element={<CmsPage />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </WishlistProvider>
      </AuthProvider>
    </SEOProvider>
  </QueryClientProvider>
);

export default App;
