import { Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { ReactNode, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/stores/authStore";
import { Permission } from "@/types";
import {
  LayoutDashboard,
  Users,
  Building2,
  Home,
  MapPin,
  Calendar,
  Package,
  CreditCard,
  Star,
  LifeBuoy,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Truck,
  Boxes,
  IndianRupee,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  section: "overview" | "operations" | "management" | "system";
  permission?: Permission;
  children?: NavItem[];
}

const navigationConfig: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    section: "overview",
    permission: "dashboard:full",
  },
  {
    name: "Vendors",
    href: "/vendors",
    icon: Building2,
    section: "operations",
    permission: "vendors:view",
    children: [
      {
        name: "All Vendors",
        href: "/vendors",
        icon: Building2,
        section: "operations",
        permission: "vendors:view",
      },
      {
        name: "Vendor Approvals",
        href: "/vendors/approval",
        icon: Shield,
        section: "operations",
        permission: "vendors:full",
      },
    ],
  },
  {
    name: "Properties",
    href: "/properties",
    icon: Home,
    section: "operations",
    permission: "properties:view",
    children: [
      {
        name: "All Properties",
        href: "/properties",
        icon: Home,
        section: "operations",
        permission: "properties:view",
      },
      {
        name: "Property Approvals",
        href: "/properties/approval",
        icon: Shield,
        section: "operations",
        permission: "properties:full",
      },
    ],
  },
  {
    name: "Temples",
    href: "/temples",
    icon: MapPin,
    section: "operations",
    permission: "properties:view",
  },
  {
    name: "Bookings",
    href: "/bookings",
    icon: Calendar,
    section: "operations",
    permission: "bookings:view",
    children: [
      {
        name: "All Bookings",
        href: "/bookings",
        icon: Calendar,
        section: "operations",
        permission: "bookings:view",
      },
      {
        name: "Service Bookings",
        href: "/service-bookings",
        icon: Truck,
        section: "operations",
        permission: "services:view",
      },
    ],
  },
  {
    name: "Services",
    href: "/services",
    icon: Package,
    section: "operations",
    permission: "services:view",
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Boxes,
    section: "operations",
    permission: "rooms:view",
  },
  {
    name: "Finance",
    href: "/payments",
    icon: CreditCard,
    section: "management",
    permission: "payments:view",
    children: [
      {
        name: "Transactions",
        href: "/payments",
        icon: CreditCard,
        section: "management",
        permission: "payments:view",
      },
      {
        name: "Vendor Payouts",
        href: "/finance/earnings",
        icon: IndianRupee,
        section: "management",
        permission: "payments:full",
      },
    ],
  },
  {
    name: "Users",
    href: "/users",
    icon: Users,
    section: "management",
    permission: "users:view",
  },
  {
    name: "Reviews",
    href: "/reviews",
    icon: Star,
    section: "management",
    permission: "reviews:view",
  },
  {
    name: "Notifications",
    href: "/notifications",
    icon: Bell,
    section: "management",
    permission: "notifications:full",
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    section: "management",
    permission: "analytics:full",
  },
  {
    name: "Support",
    href: "/support",
    icon: LifeBuoy,
    section: "management",
    permission: "users:full",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    section: "system",
    permission: "settings:full",
  },
];

function filterNavigation(
  items: NavItem[],
  checkPermission: (p: Permission) => boolean,
): NavItem[] {
  return items
    .filter((item) => !item.permission || checkPermission(item.permission))
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigation(item.children, checkPermission)
        : undefined,
    }));
}

interface AdminLayoutProps {
  children?: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, checkPermission } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = useMemo(() => navigationConfig, []);

  const sectionLabels: Record<NavItem["section"], string> = {
    overview: "Overview",
    operations: "Operations",
    management: "Management",
    system: "System",
  };

  const groupedNavigation = useMemo(() => {
    return navigation.reduce(
      (acc, item) => {
        acc[item.section].push(item);
        return acc;
      },
      {
        overview: [] as NavItem[],
        operations: [] as NavItem[],
        management: [] as NavItem[],
        system: [] as NavItem[],
      },
    );
  }, [navigation]);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold text-primary">HostHaven</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {(["overview", "operations", "management", "system"] as const).map(
              (sectionKey) => {
                const items = groupedNavigation[sectionKey];

                if (items.length === 0) {
                  return null;
                }

                return (
                  <div key={sectionKey} className="mb-4">
                    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {sectionLabels[sectionKey]}
                    </p>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div key={item.name}>
                          <Link
                            to={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive(item.href)
                                ? "bg-primary text-white"
                                : "text-gray-700 hover:bg-gray-100",
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                          </Link>
                          {item.children && isActive(item.href) && (
                            <div className="ml-6 mt-1 space-y-1">
                              {item.children.map((child) => (
                                <Link
                                  key={child.href}
                                  to={child.href}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                                    location.pathname === child.href
                                      ? "text-primary font-medium"
                                      : "text-gray-600 hover:text-gray-900",
                                  )}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <child.icon className="w-4 h-4" />
                                  {child.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </nav>

          <div className="p-4 border-t">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-primary font-medium text-sm">
                  {user?.firstName?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 capitalize">
              {user?.role?.replace("_", " ")}
            </span>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children || <Outlet />}</main>
      </div>
    </div>
  );
}

export function AuthLayout() {
  return <Outlet />;
}

export function BlankLayout() {
  return <Outlet />;
}
