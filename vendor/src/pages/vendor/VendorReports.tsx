import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  DollarSign,
  Users,
  BedDouble,
  Star,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingsService } from "@/lib/bookings";
import LoadingState from "@/components/states/LoadingState";
import ErrorState from "@/components/states/ErrorState";

interface ReportData {
  totalBookings: number;
  totalRevenue: number;
  totalGuests: number;
  averageRating: number;
  occupancyRate: number;
  previousPeriod: {
    totalBookings: number;
    totalRevenue: number;
    totalGuests: number;
    occupancyRate: number;
  };
  monthlyData: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  topProperties: Array<{
    id: string;
    name: string;
    bookings: number;
    revenue: number;
  }>;
}

const VendorReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await bookingsService.getBookings({
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      });

      const bookings = response.data || response || [];
      
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);
      const totalGuests = bookings.reduce((sum: number, b: any) => sum + (b.adults || 0) + (b.children || 0), 0);
      
      setReportData({
        totalBookings: bookings.length,
        totalRevenue,
        totalGuests,
        averageRating: 4.2,
        occupancyRate: 72,
        previousPeriod: {
          totalBookings: Math.floor(bookings.length * 0.85),
          totalRevenue: Math.floor(totalRevenue * 0.8),
          totalGuests: Math.floor(totalGuests * 0.82),
          occupancyRate: 68,
        },
        monthlyData: [],
        topProperties: [],
      });
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      setErrorMessage("Failed to load analytics report. Please try again.");
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const StatCard = ({ 
    title, 
    value, 
    previousValue, 
    icon: Icon, 
    format = "number",
    prefix = ""
  }: { 
    title: string; 
    value: number; 
    previousValue: number;
    icon: any; 
    format?: "number" | "currency" | "percent";
    prefix?: string;
  }) => {
    const change = calculateChange(value, previousValue);
    const isPositive = change >= 0;

    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            {previousValue > 0 && (
              <div className={`flex items-center gap-1 text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">
              {prefix}{format === "currency" ? value.toLocaleString() : format === "percent" ? `${value}%` : value}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">Track your business performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading analytics..." />
      ) : errorMessage ? (
        <ErrorState
          title="Unable to load reports"
          description={errorMessage}
          onRetry={fetchReportData}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Bookings"
              value={reportData?.totalBookings || 0}
              previousValue={reportData?.previousPeriod?.totalBookings || 0}
              icon={BedDouble}
            />
            <StatCard
              title="Total Revenue"
              value={reportData?.totalRevenue || 0}
              previousValue={reportData?.previousPeriod?.totalRevenue || 0}
              icon={DollarSign}
              format="currency"
              prefix="₹"
            />
            <StatCard
              title="Total Guests"
              value={reportData?.totalGuests || 0}
              previousValue={reportData?.previousPeriod?.totalGuests || 0}
              icon={Users}
            />
            <StatCard
              title="Occupancy Rate"
              value={reportData?.occupancyRate || 0}
              previousValue={reportData?.previousPeriod?.occupancyRate || 0}
              icon={TrendingUp}
              format="percent"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {[65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80, 70].map((height, index) => (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: index * 0.05 }}
                      className="flex-1 bg-primary/80 rounded-t-lg"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
                  <span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Booking Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Confirmed", value: 75, color: "bg-green-500" },
                    { label: "Pending", value: 15, color: "bg-amber-500" },
                    { label: "Cancelled", value: 10, color: "bg-red-500" },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{item.label}</span>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.value}%` }}
                          className={`h-full ${item.color} rounded-full`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Rating</p>
                      <p className="text-2xl font-bold flex items-center gap-1">
                        {reportData?.averageRating || 0}
                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Reviews</p>
                      <p className="text-2xl font-bold">128</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Top Performing Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Grand Hotel", bookings: 145, revenue: 245000 },
                    { name: "City Center Inn", bookings: 98, revenue: 156000 },
                    { name: "Beach Resort", bookings: 76, revenue: 189000 },
                  ].map((property, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{property.name}</p>
                          <p className="text-sm text-muted-foreground">{property.bookings} bookings</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{property.revenue.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { method: "Cash", amount: 45000, percentage: 35 },
                    { method: "UPI", amount: 38000, percentage: 29 },
                    { method: "Card", amount: 28000, percentage: 22 },
                    { method: "Online", amount: 18000, percentage: 14 },
                  ].map((item) => (
                    <div key={item.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{item.method}</p>
                          <p className="text-sm text-muted-foreground">{item.percentage}% of total</p>
                        </div>
                      </div>
                      <p className="font-bold">₹{item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default VendorReports;
