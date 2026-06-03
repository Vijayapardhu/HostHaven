import { Bell, Mail, Smartphone, Check, CheckCheck, Package, Calendar, Heart, CreditCard } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { handleError } from "@/lib/errorHandler";
import usePushNotifications from "@/hooks/usePushNotifications";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

const Notifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({
    email: true,
    sms: false,
    bookings: true,
    promotions: false,
    wishlist: true,
  });

  const { isSupported, subscription, subscribe, unsubscribe, requestPermission } = usePushNotifications();

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (isSupported && subscription) {
      setPreferences(prev => ({ ...prev, sms: true }));
    }
  }, [isSupported, subscription]);

  const loadNotifications = async () => {
    try {
      const response = await api.auth.getNotifications({ limit: "50" });
      const list = Array.isArray(response?.data) ? response.data : [];
      setNotifications(
        list.map((notification: Notification) => ({
          ...notification,
          read: notification.read ?? notification.isRead ?? false,
        })),
      );
    } catch (error) {
      handleError(error, 'api');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.auth.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      toast({ title: "Failed to mark as read", variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.auth.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      toast({ title: "Failed to mark all as read", variant: "destructive" });
    }
  };

  const handlePushToggle = async (enabled: boolean) => {
    if (!isSupported) {
      toast({ title: "Push notifications not supported", description: "Your browser does not support push notifications.", variant: "destructive" });
      return;
    }

    try {
      if (enabled) {
        const permission = await requestPermission();
        if (permission !== "granted") {
          toast({ title: "Permission denied", description: "Please enable notifications in your browser settings.", variant: "destructive" });
          setPreferences(prev => ({ ...prev, sms: false }));
          return;
        }
        const success = await subscribe();
        if (success) {
          setPreferences(prev => ({ ...prev, sms: true }));
          toast({ title: "Push notifications enabled" });
        } else {
          toast({ title: "Failed to enable push notifications", variant: "destructive" });
          setPreferences(prev => ({ ...prev, sms: false }));
        }
      } else {
        await unsubscribe();
        setPreferences(prev => ({ ...prev, sms: false }));
        toast({ title: "Push notifications disabled" });
      }
    } catch (error) {
      console.error("Push toggle error:", error);
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "BOOKING":
      case "BOOKING_CONFIRMED":
      case "BOOKING_CANCELLED":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "PAYMENT":
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case "WISHLIST":
        return <Heart className="w-5 h-5 text-rose-500" />;
      case "PROMOTION":
        return <Package className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return (
      <Layout>
        <div className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Please log in</h1>
            <p className="text-muted-foreground mb-6">Log in to view your notifications.</p>
            <Link to="/login">
              <Button variant="gold">Login</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-card p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-card overflow-hidden">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border last:border-0 flex items-start gap-3 hover:bg-muted/50 transition-colors ${
                    !notification.read ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{notification.title}</p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                    {typeof notification.data?.imageUrl === "string" && notification.data.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={notification.data.imageUrl}
                          alt="Notification"
                          className="max-h-40 rounded-lg border object-cover"
                        />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notification.read && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark notification as read"
                      aria-label="Mark notification as read"
                      className="p-2 hover:bg-muted rounded-full transition-colors"
                    >
                      <Check className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="bg-card rounded-2xl shadow-card p-6 mt-6 space-y-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notification Preferences
            </h3>
            
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Notifications
              </h4>
              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-muted-foreground">Booking confirmations</span>
                  <input 
                    type="checkbox" 
                    checked={preferences.bookings}
                    onChange={(e) => setPreferences({...preferences, bookings: e.target.checked})}
                    className="w-5 h-5 text-primary rounded" 
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-muted-foreground">Promotions & offers</span>
                  <input 
                    type="checkbox" 
                    checked={preferences.promotions}
                    onChange={(e) => setPreferences({...preferences, promotions: e.target.checked})}
                    className="w-5 h-5 text-primary rounded" 
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-muted-foreground">Wishlist updates</span>
                  <input 
                    type="checkbox" 
                    checked={preferences.wishlist}
                    onChange={(e) => setPreferences({...preferences, wishlist: e.target.checked})}
                    className="w-5 h-5 text-primary rounded" 
                  />
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Smartphone className="w-4 h-4" /> Push Notifications
              </h4>
              {!isSupported ? (
                <p className="text-sm text-muted-foreground">Push notifications are not supported in your browser.</p>
              ) : (
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-muted-foreground">Enable push notifications</span>
                  <input 
                    type="checkbox" 
                    checked={preferences.sms}
                    onChange={(e) => handlePushToggle(e.target.checked)}
                    className="w-5 h-5 text-primary rounded" 
                  />
                </label>
              )}
            </div>

            <Button onClick={() => toast({ title: "Preferences saved" })} className="w-full">
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Notifications;
