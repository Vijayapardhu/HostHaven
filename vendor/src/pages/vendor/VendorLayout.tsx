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
  ShoppingCart,
  CheckCircle,
  AlertCircle,
  Calendar,
  BarChart3,
  Headphones,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl hover:bg-slate-100 transition-all duration-200 active:scale-95"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <Link to="/vendor/dashboard" className="flex items-center gap-2">
            <img src={logo} alt="HostHaven" className="h-8 transition-transform hover:scale-105" />
          </Link>
          <Link to="/vendor/notifications" className="relative p-2 rounded-xl hover:bg-slate-100 transition-all active:scale-95" aria-label="Notifications">
            <Bell className="w-6 h-6 text-slate-700" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Link>
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
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <Link to="/vendor/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                  <img src={logo} alt="HostHaven" className="h-10" />
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-slate-700" />
                </button>
              </div>
              
              {/* Mobile Vendor Info */}
              <div className="p-4 border-b border-slate-200/60">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {vendor?.businessName?.charAt(0) || "V"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-slate-900">{vendor?.businessName}</p>
                    <p className="text-xs text-slate-600 truncate">{vendor?.user?.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {vendor?.isApproved ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Pending Approval
                    </span>
                  )}
                </div>
              </div>

              <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                {sidebarLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30"
                          : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                      }`}
                    >
                      <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
                      <span className="font-medium text-sm">{link.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  );
                })}
              </nav>
              
              <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 bg-white">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 group"
                >
                  <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
                  <span className="font-medium text-sm">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-slate-200 flex-col z-40 shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <Link to="/vendor/dashboard" className="flex items-center gap-3 group">
            <img src={logo} alt="HostHaven" className="h-12 transition-transform group-hover:scale-105" />
          </Link>
        </div>

        {/* Vendor Info */}
        <div className="p-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/10">
            <Avatar className="h-11 w-11 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-base">
                {vendor?.businessName?.charAt(0) || "V"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-slate-900">{vendor?.businessName}</p>
              <p className="text-xs text-slate-600 truncate">{vendor?.user?.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {vendor?.isApproved ? (
              <span className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                Verified
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Pending Approval
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/30"
                    : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                }`}
              >
                <link.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-white" : ""}`} />
                <span className="font-medium text-sm">{link.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-red-600 hover:bg-red-50 transition-all duration-200 group"
          >
            <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-[280px] pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-[1600px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default VendorLayout;
