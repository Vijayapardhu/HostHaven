import { Link, useLocation } from "react-router-dom";
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
      name: "Temples",
      path: "/temples",
      icon: Landmark,
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
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
                <Icon className={`w-6 h-6 ${active ? "fill-primary/20" : ""}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 ${active ? "font-semibold" : ""}`}>
                {item.name}
              </span>
              {active && (
                <div className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-8 h-[3px] bg-primary rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
