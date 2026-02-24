import { useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BedDouble,
  CalendarDays,
  Star,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
  User,
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3,
  Headphones,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { useVendor } from "@/contexts/VendorContext";
import { useToast } from "@/hooks/use-toast";

const sidebarLinks = [
  { path: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vendor/pos", label: "Room Inventory (POS)", icon: ShoppingCart },
  { path: "/vendor/pos/history", label: "Sales & Invoices", icon: FileText },
  { path: "/vendor/properties", label: "My Hotels", icon: Building2 },
  { path: "/vendor/rooms", label: "Room Management", icon: BedDouble },
  { path: "/vendor/bookings", label: "Bookings", icon: CalendarDays },
  { path: "/vendor/calendar", label: "Availability Calendar", icon: Calendar },
  { path: "/vendor/reports", label: "Reports & Analytics", icon: BarChart3 },
  { path: "/vendor/support", label: "Support", icon: Headphones },
  { path: "/vendor/notifications", label: "Notifications", icon: Bell },
  { path: "/vendor/reviews", label: "Reviews", icon: Star },
  { path: "/vendor/earnings", label: "Earnings", icon: DollarSign },
  { path: "/vendor/settings", label: "Settings", icon: Settings },
];

const VendorLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vendor, logout } = useVendor();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/vendor/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-background to-cream-light">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/vendor/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="HostHaven" className="h-8" />
          </Link>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-card z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <Link to="/vendor/dashboard" className="flex items-center gap-2">
                  <img src={logo} alt="HostHaven" className="h-10" />
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="p-4 space-y-2">
                {sidebarLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <link.icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[280px] bg-card/80 backdrop-blur-xl border-r border-border/50 flex-col z-40">
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <Link to="/vendor/dashboard" className="flex items-center gap-3">
            <img src={logo} alt="HostHaven" className="h-12" />
          </Link>
        </div>

        {/* Vendor Info */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{vendor?.businessName}</p>
              <p className="text-xs text-muted-foreground truncate">{vendor?.user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {vendor?.isApproved ? (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-600/10 px-2 py-1 rounded-full">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-600/10 px-2 py-1 rounded-full">
                <AlertCircle className="w-3 h-3" />
                Pending
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="font-medium">{link.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-[280px] pt-16 lg:pt-0">
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default VendorLayout;
