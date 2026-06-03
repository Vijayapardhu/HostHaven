import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, LogOut, Heart, Calendar, ChevronRight, LifeBuoy, Camera, Shield, Bell, Edit2, Loader2, Phone, MapPin, MessageSquare, Star, Clock, CheckCircle } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import api from "@/lib/api";

const Profile = () => {
  const { user, logout, refreshUser } = useAuth();
  const { items } = useWishlist();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<number | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => {
    if (user) {
      api.bookings.getMy({ limit: "1" })
        .then((result) => setBookingCount(result?.meta?.total ?? 0))
        .catch(() => setBookingCount(0));
      
      api.bookings.getMy({ status: "CHECKED_OUT", limit: "1" })
        .then((result) => setCompletedBookings(result?.meta?.total ?? 0))
        .catch(() => setCompletedBookings(0));
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
              Please log in
            </h1>
            <p className="text-muted-foreground mb-6">
              Log in to view your profile and bookings
            </p>
            <Link to="/login">
              <Button variant="gold">Login</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate("/");
    }, 500);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const avatarUrl = await api.auth.uploadAvatar(file);
      await api.auth.updateProfile({ avatar: avatarUrl });
      await refreshUser();
      toast({ title: "Profile photo updated" });
    } catch (error) {
      toast({ title: "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEnableNotifications = async () => {
    if (!("Notification" in window)) {
      toast({ title: "Notifications not supported", variant: "destructive" });
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U"
          ),
        });
        await api.push.subscribe(sub.toJSON());
        setNotificationsEnabled(true);
        toast({ title: "Notifications enabled successfully!" });
      } else {
        toast({ title: "Notification permission denied", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Failed to enable notifications", variant: "destructive" });
    }
  };

  const menuItems = [
    { icon: Edit2, label: "Edit Profile", value: "Name, phone, photo", path: "/profile/edit", color: "text-primary" },
    { icon: MapPin, label: "Saved Addresses", value: "Manage delivery addresses", path: "/profile/edit", color: "text-green-500" },
    { icon: Heart, label: "My Wishlist", value: `${items.length} temples saved`, path: "/wishlist", color: "text-rose-500" },
    { icon: Calendar, label: "My Bookings", value: `${bookingCount !== null ? bookingCount : '...'} bookings`, path: "/bookings", color: "text-blue-500" },
    { icon: Star, label: "My Reviews", value: "Reviews you wrote", path: "/profile/reviews", color: "text-amber-500" },
    { icon: Bell, label: "Notifications", value: notificationsEnabled ? "Enabled" : "Enable push notifications", path: "/profile/notifications", color: "text-orange-500", badge: notificationsEnabled ? "Enabled" : null },
    { icon: Shield, label: "Privacy & Security", value: "Password, 2FA", path: "/profile/security", color: "text-purple-500" },
    { icon: MessageSquare, label: "Support", value: "Help center", path: "/profile/support", color: "text-cyan-500" },
  ];

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-card rounded-2xl shadow-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-4 border-gold/30">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-serif font-bold text-foreground">
                  {user.name}
                </h1>
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <Phone className="w-4 h-4" />
                    {user.phone}
                  </div>
                )}
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                    <Shield className="w-3 h-3" /> Verified account
                  </span>
                )}
                {user.createdAt && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                    <Clock className="w-3 h-3" />
                    Member since {new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </div>
                )}
              </div>
              <Link to="/profile/edit">
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Link to="/wishlist" className="bg-gradient-to-br from-primary/10 to-gold/10 rounded-xl p-4 text-center hover:opacity-90 transition-opacity">
              <div className="text-2xl font-bold text-primary">{items.length}</div>
              <div className="text-xs text-muted-foreground">Wishlisted</div>
            </Link>
            <Link to="/bookings" className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-xl p-4 text-center hover:opacity-90 transition-opacity">
              <div className="text-2xl font-bold text-blue-600">{bookingCount ?? 0}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </Link>
            <Link to="/bookings?status=CHECKED_OUT" className="bg-gradient-to-br from-gold/10 to-heritage-brown/10 rounded-xl p-4 text-center hover:opacity-90 transition-opacity">
              <div className="text-2xl font-bold text-gold">{completedBookings ?? 0}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </Link>
          </div>

          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.path} className={`flex items-center justify-between p-4 hover:bg-muted transition-colors ${index !== menuItems.length - 1 ? "border-b border-border" : ""}`}>
                  <Link to={item.path} className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      {item.value && (
                        <p className="text-xs text-muted-foreground">{item.value}</p>
                      )}
                    </div>
                  </Link>
                  {item.badge ? (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      {item.badge}
                    </span>
                  ) : item.path === "/profile/notifications" && !notificationsEnabled ? (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={handleEnableNotifications}>
                      Enable
                    </Button>
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms & Conditions
            </Link>
            <span className="text-border">|</span>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>

          <Button
            variant="outline"
            className="w-full mt-4 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default Profile;
