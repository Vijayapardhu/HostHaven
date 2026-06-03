import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Compass, Heart, User, LogIn, Landmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { items } = useWishlist();

  const navItems = [
    {
      name: "Explore",
      path: "/",
      icon: Compass,
      activePaths: ["/", "/hotels", "/homes", "/services"],
    },
    {
      name: "Wishlist",
      path: "/wishlist",
      icon: Heart,
      badge: items.length > 0 ? items.length : undefined,
    },
    {
      name: isAuthenticated ? "Profile" : "Login",
      path: isAuthenticated ? "/profile" : "/login",
      icon: isAuthenticated ? User : LogIn,
    },
  ];

  const isActive = (path: string, activePaths?: string[]) => {
    if (activePaths) {
      return activePaths.some((p) => {
        if (p === "/") return location.pathname === "/";
        return location.pathname.startsWith(p);
      });
    }
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom shadow-lg">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.activePaths);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full relative ${active ? "text-primary" : "text-muted-foreground"
                }`}
            >
              <div className="relative">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${active ? "bg-primary/10" : ""}`}>
                  <Icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                </div>
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-0.5 ${active ? "font-semibold" : ""}`}>
                {item.name}
              </span>
              {active && (
                <motion.div
                  layoutId="bottomNavActive"
                  className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
