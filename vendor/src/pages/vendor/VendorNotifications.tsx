import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Check, CheckCheck, Trash2, Calendar, CreditCard, Star, AlertCircle, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { notificationsService } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import LoadingState from "@/components/states/LoadingState";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const VendorNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: Record<string, string> = {};
      if (filter === "unread") params.isRead = "false";
      const response = await notificationsService.getNotifications(params);
      setNotifications(response.data || response || []);
      const meta = response?.meta || {};
      setUnreadCount(meta?.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setErrorMessage("Failed to load notifications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast({ title: "Notification marked as read" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast({ title: "All notifications marked as read" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getNotificationIcon = (type: string) => {
    if (type?.includes("BOOKING")) return <Calendar className="w-5 h-5 text-blue-500" />;
    if (type?.includes("PAYMENT")) return <CreditCard className="w-5 h-5 text-green-500" />;
    if (type?.includes("REVIEW")) return <Star className="w-5 h-5 text-amber-500" />;
    return <Bell className="w-5 h-5 text-gray-500" />;
  };

  const getTimeAgo = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">Stay updated with your bookings and activities</p>
        </div>
        <div className="flex gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
              <CheckCheck className="w-4 h-4" />Mark all read
            </Button>
          )}
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          <span className="text-sm text-blue-700">You have <strong>{unreadCount}</strong> unread notification{unreadCount > 1 ? "s" : ""}</span>
        </div>
      )}

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState className="p-8" message="Loading notifications..." />
          ) : errorMessage ? (
            <ErrorState
              className="p-8"
              title="Unable to load notifications"
              description={errorMessage}
              onRetry={fetchNotifications}
            />
          ) : notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <motion.div key={notification.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={`p-4 hover:bg-muted/50 ${!notification.isRead ? "bg-blue-50/50" : ""}`}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${!notification.isRead ? "text-foreground" : "text-muted-foreground"}`}>{notification.title}</h3>
                        {!notification.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <span className="text-xs text-muted-foreground mt-2 block">{getTimeAgo(notification.createdAt)}</span>
                    </div>
                    {!notification.isRead && <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(notification.id)}><Check className="w-4 h-4" /></Button>}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="py-12"
              icon={<Bell className="w-12 h-12 text-muted" />}
              title="No Notifications"
              description={filter === "unread" ? "You have read all your notifications" : "You don't have any notifications yet"}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorNotifications;
