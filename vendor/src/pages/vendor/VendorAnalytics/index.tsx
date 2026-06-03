import { useState, useEffect } from "react";
import { TrendingUp, DollarSign, BedDouble, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bookingsService } from "@/lib/bookings";
import LoadingState from "@/components/states/LoadingState";

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  occupancyRate: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  bookingTrends: Array<{ date: string; count: number }>;
}

const VendorAnalytics = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const bookings = await bookingsService.getBookings({ limit: "100" });

      const bookingData = bookings.data || [];
      const totalRevenue = bookingData.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);
      
      const confirmedBookings = bookingData.filter((b: any) => b.status === "CONFIRMED");
      const totalRooms = confirmedBookings.reduce((sum: number, b: any) => sum + (b.rooms?.length || 1), 0);
      const totalNights = confirmedBookings.reduce((sum: number, b: any) => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        return sum + (nights > 0 ? nights : 1);
      }, 0);
      const occupancyRate = totalRooms > 0 && totalNights > 0 ? Math.round((totalRooms / totalNights) * 100) : 0;

      const now = new Date();
      const monthlyRevenueMap: Record<string, number> = {};
      const bookingTrendsMap: Record<string, number> = {};
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = date.toLocaleString('default', { month: 'short' });
        monthlyRevenueMap[monthKey] = 0;
      }
      
      bookingData.forEach((booking: any) => {
        const checkIn = new Date(booking.checkInDate);
        const monthKey = checkIn.toLocaleString('default', { month: 'short' });
        const dateKey = `${checkIn.getFullYear()}-${String(checkIn.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyRevenueMap[monthKey] !== undefined) {
          monthlyRevenueMap[monthKey] += booking.totalAmount || 0;
        }
        
        bookingTrendsMap[dateKey] = (bookingTrendsMap[dateKey] || 0) + 1;
      });

      const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({
        month,
        revenue,
      }));

      const bookingTrends = Object.entries(bookingTrendsMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([date, count]) => ({
          date,
          count,
        }));

      setAnalytics({
        totalBookings: bookingData.length,
        totalRevenue,
        averageBookingValue: bookingData.length > 0 ? totalRevenue / bookingData.length : 0,
        occupancyRate: Math.min(occupancyRate, 100),
        confirmedBookings: confirmedBookings.length,
        pendingBookings: bookingData.filter((b: any) => b.status === "PENDING").length,
        cancelledBookings: bookingData.filter((b: any) => b.status === "CANCELLED").length,
        monthlyRevenue,
        bookingTrends,
      });
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      setAnalytics({
        totalBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
        occupancyRate: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        monthlyRevenue: [],
        bookingTrends: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingState />;
  }

  const StatCard = ({ title, value, icon: Icon, trend }: { title: string; value: string | number; icon: any; trend?: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {trend}
              </p>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-full">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Track your property performance and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Bookings" value={analytics?.totalBookings || 0} icon={Calendar} />
        <StatCard title="Total Revenue" value={`₹${(analytics?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Avg. Booking Value" value={`₹${(analytics?.averageBookingValue || 0).toFixed(0)}`} icon={TrendingUp} />
        <StatCard title="Occupancy Rate" value={`${analytics?.occupancyRate || 0}%`} icon={BedDouble} />
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="occupancy">Occupancy</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border-2 border-dashed rounded-lg">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Revenue chart visualization</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Total: ₹{(analytics?.totalRevenue || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Booking Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Confirmed</span>
                  <span className="text-green-600 font-bold">{analytics?.confirmedBookings || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Pending</span>
                  <span className="text-amber-600 font-bold">{analytics?.pendingBookings || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <span className="font-medium">Cancelled</span>
                  <span className="text-red-600 font-bold">{analytics?.cancelledBookings || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy">
          <Card>
            <CardHeader>
              <CardTitle>Occupancy Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Current Month</span>
                    <span className="font-medium">{analytics?.occupancyRate || 0}%</span>
                  </div>
                  <div className="h-4 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${analytics?.occupancyRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorAnalytics;
