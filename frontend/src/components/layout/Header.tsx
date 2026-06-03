import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Hotel, Home, Landmark, Wrench, LogIn, UserPlus, House, Heart, User, LogOut, Search, Bell, Check, Calendar, CreditCard, Star, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { api } from "@/lib/api";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const navLinks = [
  { name: "Hotels", path: "/hotels", icon: Hotel },
  { name: "Homestays", path: "/homes", icon: Home },
  { name: "Temples", path: "/temples", icon: Landmark },
  { name: "Services", path: "/services", icon: Wrench },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { items } = useWishlist();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const response = await api.auth.getNotifications?.() || { data: [], meta: {} };
      const data = response.data || [];
      setNotifications(data.slice(0, 5));
      const meta = response.meta || {};
      setUnreadCount(meta.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.auth.markNotificationRead?.(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type?.includes("BOOKING")) return <Calendar className="w-4 h-4 text-blue-500" />;
    if (type?.includes("PAYMENT")) return <CreditCard className="w-4 h-4 text-green-500" />;
    if (type?.includes("REVIEW")) return <Star className="w-4 h-4 text-amber-500" />;
    return <Bell className="w-4 h-4 text-gray-500" />;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md shadow-card border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-24">
            <Link to="/" className="flex items-center flex-1">
              <img src={logo} alt="HostHaven" className="h-20 md:h-24 w-auto" />
            </Link>

            <nav className="md:hidden flex items-center justify-center gap-2 flex-1">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={link.path}
                      className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all relative ${isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isActive ? "bg-primary/10" : ""}`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                      </motion.div>
                      <span className={`text-[10px] font-medium ${isActive ? "font-semibold" : ""}`}>{link.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeNavMobile"
                          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full"
                        />
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
              {navLinks.map((link, index) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    <Link
                      to={link.path}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                        ? "text-primary bg-primary/10 shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                      {link.name}
                    </Link>
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute -bottom-0.5 left-3 right-3 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </motion.div>
                );
              })}
              <div className="w-px h-6 bg-border/50 mx-2" />
              <Link
                to="/wishlist"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 relative"
              >
                <Heart className="w-4 h-4" />
                {items.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {items.length}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                >
                  <User className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      
      {/* Search Bar Section */}

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-40 bg-background"
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <img src={logo} alt="HostHaven" className="h-10 w-auto" />
              </Link>
              <button
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-gradient-to-r from-heritage-brown to-heritage-brown/90">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border-2 border-white/20">
                    <AvatarImage src={user?.avatar} alt={user?.name} />
                    <AvatarFallback className="bg-white/10 text-cream-light">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-cream-light">{user?.name}</p>
                    <p className="text-xs text-cream-light/70">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="p-2 rounded-lg bg-white/10"
                  >
                    <LogOut className="w-5 h-5 text-cream-light" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link
                    to="/login"
                    className="flex-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl py-3 px-4 border border-white/20">
                      <LogIn className="w-5 h-5 text-cream-light" />
                      <span className="font-medium text-cream-light">Login</span>
                    </div>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex items-center justify-center gap-2 bg-gradient-to-r from-gold to-gold-dark rounded-xl py-3 px-4">
                      <UserPlus className="w-5 h-5 text-heritage-brown" />
                      <span className="font-medium text-heritage-brown">Sign Up</span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Browse Categories
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {navLinks.map((link, index) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className="flex flex-col items-center"
                      >
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`w-14 h-14 rounded-xl flex items-center justify-center mb-1.5 transition-all ${isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        >
                          <Icon className="w-6 h-6" />
                        </motion.div>
                        <span className={`text-xs font-medium ${isActive ? "text-primary font-semibold" : "text-foreground"
                          }`}>
                          {link.name}
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="px-4 mt-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Quick Access
              </h3>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <motion.div whileHover={{ x: 4 }}>
                  <Link
                    to="/wishlist"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-foreground">My Wishlist</span>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{items.length} items</span>
                  </Link>
                </motion.div>
                {isAuthenticated && (
                  <motion.div whileHover={{ x: 4 }}>
                    <Link
                      to="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium text-foreground">My Profile</span>
                      </div>
                      <span className="text-muted-foreground">→</span>
                    </Link>
                  </motion.div>
                )}
                {[
                  { name: "Temple Tours", path: "/temples" },
                  { name: "Contact Us", path: "/contact" },
                ].map((item, index) => (
                  <motion.div key={item.name} whileHover={{ x: 4 }}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center justify-between p-4 hover:bg-muted transition-colors ${index === 1 ? "" : "border-b border-border"
                        }`}
                    >
                      <span className="text-sm font-medium text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">→</span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="px-4 mt-4">
              <div className="bg-gradient-to-r from-gold/10 to-primary/10 rounded-xl p-4 border border-gold/20">
                <h3 className="font-semibold text-foreground mb-1">Are you a property owner?</h3>
                <p className="text-xs text-muted-foreground mb-3">List your property and start earning</p>
                <a
                  href="https://vendor.hosthaven.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  Become a Partner →
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
