import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  BedDouble,
  CalendarDays,
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  CheckCircle,
  ArrowUpRight,
  Users,
  Wallet,
  Hotel,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useVendor } from "@/contexts/VendorContext";

interface DashboardData {
  vendor: {
    id: string;
    businessName: string;
    isApproved: boolean;
    commissionRate: number;
    user: {
      name: string;
      email: string;
    };
  };
  stats: {
    propertiesCount: number;
    activeBookings: number;
    totalRevenue: number;
    pendingPayouts: number;
  };
  recentBookings: Array<{
    id: string;
    bookingNumber: string;
    user: { name: string; email: string };
    property: { name: string };
    room?: { name: string };
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
}

const VendorDashboard = () => {
  const { vendor } = useVendor();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.vendor.getDashboard();
        setData(response);
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-blue-100 text-blue-700"><Users className="w-3 h-3 mr-1" />Checked In</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Welcome back, {data?.vendor?.user?.name || vendor?.user?.name || "Partner"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's what's happening with your hotels today.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/vendor/properties">
            <Button variant="outline">
              <Building2 className="w-4 h-4 mr-2" />
              Manage Hotels
            </Button>
          </Link>
          <Link to="/vendor/bookings">
            <Button>
              <CalendarDays className="w-4 h-4 mr-2" />
              View Bookings
            </Button>
          </Link>
        </div>
      </div>

      {/* Not Approved Warning */}
      {!vendor?.isApproved && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-800">Verification Pending</h3>
              <p className="text-amber-700 mt-1">
                Your vendor account is under review. You can still manage your hotels but they won't be visible until approved.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg shadow-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  +12%
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{data?.stats?.propertiesCount || 0}</p>
                <p className="text-muted-foreground text-sm">Total Hotels</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg shadow-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  +8%
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">{data?.stats?.activeBookings || 0}</p>
                <p className="text-muted-foreground text-sm">Active Bookings</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg shadow-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                  <ArrowUpRight className="w-4 h-4" />
                  +23%
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">₹{(data?.stats?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-muted-foreground text-sm">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg shadow-purple-500/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="flex items-center gap-1 text-amber-600 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  Pending
                </span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold">₹{(data?.stats?.pendingPayouts || 0).toLocaleString()}</p>
                <p className="text-muted-foreground text-sm">Pending Payouts</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg h-full">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/vendor/properties" className="block">
                <Button variant="outline" className="w-full justify-start h-12">
                  <Building2 className="w-5 h-5 mr-3 text-primary" />
                  Add New Hotel
                </Button>
              </Link>
              <Link to="/vendor/rooms" className="block">
                <Button variant="outline" className="w-full justify-start h-12">
                  <BedDouble className="w-5 h-5 mr-3 text-blue-500" />
                  Manage Rooms
                </Button>
              </Link>
              <Link to="/vendor/reviews" className="block">
                <Button variant="outline" className="w-full justify-start h-12">
                  <Star className="w-5 h-5 mr-3 text-amber-500" />
                  View Reviews
                </Button>
              </Link>
              <Link to="/vendor/settings" className="block">
                <Button variant="outline" className="w-full justify-start h-12">
                  <TrendingUp className="w-5 h-5 mr-3 text-green-500" />
                  View Analytics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Bookings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <Link to="/vendor/bookings">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowUpRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {data?.recentBookings && data.recentBookings.length > 0 ? (
                <div className="space-y-4">
                  {data.recentBookings.slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <CalendarDays className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{booking.property.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.user.name} • {booking.room?.name || "Standard Room"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{booking.totalAmount.toLocaleString()}</p>
                        {getStatusBadge(booking.status)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CalendarDays className="w-12 h-12 text-muted mx-auto mb-4" />
                  <p className="text-muted-foreground">No bookings yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Hotel Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Your Hotels</CardTitle>
            <Link to="/vendor/properties">
              <Button variant="ghost" size="sm">
                Manage All
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/vendor/properties"
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/50 hover:border-primary/50 hover:bg-muted/50 transition-all min-h-[280px]"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <p className="font-medium">Add New Hotel</p>
                <p className="text-sm text-muted-foreground">Expand your hotel portfolio</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VendorDashboard;
