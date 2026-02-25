import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'sonner'
import AdminLogin from './pages/AdminLogin'
import Success from './pages/Success'
import ErrorPage from './pages/ErrorPage'
import LoadingPage from './pages/LoadingPage'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Vendors from './pages/Vendors'
import VendorApproval from './pages/VendorApproval'
import Properties from './pages/Properties'
import PropertyApproval from './pages/PropertyApproval'
import Bookings from './pages/Bookings'
import Payments from './pages/Payments'
import Reviews from './pages/Reviews'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Support from './pages/Support'
import Inventory from './pages/Inventory'
import Services from './pages/Services'
import ServiceBookings from './pages/ServiceBookings'
import Notifications from './pages/Notifications'
import Temples from './pages/Temples'
import AddTemple from './pages/AddTemple'
import AddService from './pages/AddService'
import ServiceBookingDetails from './pages/ServiceBookingDetails'
import UserDetails from './pages/UserDetails'
import VendorDetails from './pages/VendorDetails'
import PropertyDetails from './pages/PropertyDetails'
import BookingDetails from './pages/BookingDetails'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/success" element={<Success />} />
          <Route path="/error" element={<ErrorPage />} />
          <Route path="/loading" element={<LoadingPage />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/users/:id" element={<UserDetails />} />
            <Route path="/vendors" element={<Vendors />} />
            <Route path="/vendors/:id" element={<VendorDetails />} />
            <Route path="/vendors/approval" element={<VendorApproval />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/properties/approval" element={<PropertyApproval />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/bookings/:id" element={<BookingDetails />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/support" element={<Support />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/new" element={<AddService />} />
            <Route path="/services/:id/edit" element={<AddService />} />
            <Route path="/service-bookings" element={<ServiceBookings />} />
            <Route path="/service-bookings/:id" element={<ServiceBookingDetails />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/temples" element={<Temples />} />
            <Route path="/temples/new" element={<AddTemple />} />
            <Route path="/temples/:id/edit" element={<AddTemple />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  )
}

export default App
