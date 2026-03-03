import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Hotel, Home, Landmark, Wrench, LogIn, UserPlus, House, Heart, User, LogOut, Search, Bell, Check, Calendar, CreditCard, Star } from "lucide-react";
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

const defaultNavLinks = [
  { name: "Hotels", path: "/hotels", emoji: "🏨", type: "HOTEL" },
  { name: "Homes", path: "/homes", emoji: "🏡", type: "HOME" },
  { name: "Temples", path: "/temples", emoji: "🛕", type: "TEMPLE" },
  { name: "Services", path: "/services", emoji: "🔧", type: "SERVICE" },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [navLinks, setNavLinks] = useState(defaultNavLinks);
  const [isLoadingNav, setIsLoadingNav] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { items } = useWishlist();

  useEffect(() => {
    const checkAvailableContent = async () => {
      try {
        const availableTypes: string[] = [];
        
        for (const link of defaultNavLinks) {
          if (link.type === "SERVICE") {
            availableTypes.push(link.name);
          } else {
            try {
              const propRes = await api.properties.getAll?.({ type: link.type, limit: "1" });
              if (propRes?.data?.length > 0 || propRes?.length > 0) {
                availableTypes.push(link.name);
              }
            } catch { continue; }
          }
        }
        
        const filtered = defaultNavLinks.filter(link => availableTypes.includes(link.name));
        setNavLinks(filtered.length > 0 ? filtered : defaultNavLinks);
      } catch {
        setNavLinks(defaultNavLinks);
      } finally {
        setIsLoadingNav(false);
      }
    };

    checkAvailableContent();
  }, []);

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
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md shadow-card">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-24 md:h-20">
            <Link to="/" className="flex items-center flex-1">
              <img src={logo} alt="HostHaven" className="h-16 md:h-14 w-auto" />
            </Link>

            <nav className="md:hidden flex items-center justify-center gap-3 flex-1">
              {navLinks.map((link, index) => {
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
                      className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all ${isActive
                          ? "text-primary"
                          : "text-muted-foreground"
                        }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-2xl"
                      >
                        {link.emoji}
                      </motion.div>
                      <span className="text-[11px] font-medium">{link.name}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <nav className="hidden md:flex items-center justify-center gap-1 flex-1">
              {navLinks.map((link, index) => {
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
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${isActive
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="text-lg"
                      >
                        {link.emoji}
                      </motion.div>
                      {link.name}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
              <Link to="/wishlist" className="relative">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button variant="ghost" size="icon">
                    <Heart className="w-5 h-5" />
                    {items.length > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
                      >
                        {items.length > 99 ? "99+" : items.length}
                      </motion.span>
                    )}
                  </Button>
                </motion.div>
              </Link>
              {isAuthenticated && (
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                      className="relative"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </motion.span>
                      )}
                    </Button>
                  </motion.div>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {isNotificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg border border-border overflow-hidden z-50"
                      >
                        <div className="p-3 border-b border-border flex items-center justify-between">
                          <h3 className="font-semibold">Notifications</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsNotificationsOpen(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                className={`p-3 border-b border-border/50 hover:bg-muted/50 transition-colors ${!notification.isRead ? "bg-blue-50/50" : ""
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-1">
                                    {getNotificationIcon(notification.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>
                                      {notification.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {notification.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {getTimeAgo(notification.createdAt)}
                                    </p>
                                  </div>
                                  {!notification.isRead && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center">
                              <Bell className="w-8 h-8 text-muted mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No notifications</p>
                            </div>
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div className="p-2 border-t border-border">
                            <Button
                              variant="ghost"
                              className="w-full text-sm"
                              onClick={() => {
                                setIsNotificationsOpen(false);
                                navigate("/notifications");
                              }}
                            >
                              View all notifications
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <Link to="/profile">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Avatar className="w-8 h-8 border-2 border-primary/20">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {user?.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button variant="ghost" size="sm" onClick={logout}>
                      <LogOut className="w-4 h-4 mr-1" />
                      Logout
                    </Button>
                  </motion.div>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="ghost" size="sm">
                        Login
                      </Button>
                    </motion.div>
                  </Link>
                  <Link to="/signup">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="gold" size="sm">
                        Sign Up
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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
              <div className="grid grid-cols-5 gap-2">
                {navLinks.map((link, index) => {
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
                          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-1 transition-all text-2xl ${isActive
                              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                        >
                          {link.emoji}
                        </motion.div>
                        <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-foreground"
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
                <Link
                  to="/vendor/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary"
                >
                  Become a Partner →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
