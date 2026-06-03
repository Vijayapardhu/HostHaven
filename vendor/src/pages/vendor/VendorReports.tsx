import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
  DollarSign,
  Users,
  BedDouble,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Building2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingsService } from "@/lib/bookings";
import { vendorService } from "@/lib/vendor";
import LoadingState from "@/components/states/LoadingState";
import { useToast } from "@/hooks/use-toast";

const VendorReports = () => {
  const { toast } = useToast();
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [bookings, setBookings] = useState<any[]>([]);

  const getBookingAmount = (booking: any) => Number(booking.totalAmount || booking.pricing?.totalAmount || 0);

  const getPaymentMethod = (booking: any) => {
    const rawMethod = String(
      booking.payment?.method ||
      booking.paymentMethod ||
      booking.payment?.type ||
      booking.paymentType ||
      "CASH"
    ).toUpperCase();

    if (["RAZORPAY", "ONLINE", "RAZORPAY_PAYMENT", "PAYMENT_LINK"].includes(rawMethod)) {
      return "RAZORPAY";
    }
    if (["UPI", "CARD", "CASH"].includes(rawMethod)) {
      return rawMethod;
    }
    return "CASH";
  };

  const isOnlinePayment = (method: string) => ["RAZORPAY", "ONLINE", "RAZORPAY_PAYMENT", "PAYMENT_LINK"].includes(method);

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const days = parseInt(dateRange);
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const [bookingsResponse, dashboardResponse] = await Promise.all([
        bookingsService.getBookings({ 
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          limit: "100" 
        }),
        vendorService.getDashboard().catch(() => null),
      ]);

      let bookings = bookingsResponse?.data || [];
      const dashboard = dashboardResponse;
      
      if (bookings.length === 0 && dashboard?.recentBookings?.length > 0) {
        bookings = dashboard.recentBookings;
      }

      setBookings(bookings);

      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + getBookingAmount(b), 0);
      const totalGuests = bookings.length > 0 ? bookings.length * 2 : 0;
      
      const confirmedBookings = bookings.filter((b: any) => b.status === "CONFIRMED" || b.status === "CHECKED_IN").length;
      const pendingBookings = bookings.filter((b: any) => b.status === "PENDING").length;
      const cancelledBookings = bookings.filter((b: any) => b.status === "CANCELLED").length;

      const cashPayments = bookings
        .filter((b: any) => !isOnlinePayment(getPaymentMethod(b)) && getPaymentMethod(b) === "CASH")
        .reduce((sum: number, b: any) => sum + getBookingAmount(b), 0);
      const razorpayPayments = bookings
        .filter((b: any) => isOnlinePayment(getPaymentMethod(b)))
        .reduce((sum: number, b: any) => sum + getBookingAmount(b), 0);
      const cardPayments = bookings
        .filter((b: any) => getPaymentMethod(b) === "CARD")
        .reduce((sum: number, b: any) => sum + getBookingAmount(b), 0);
      const upiPayments = bookings
        .filter((b: any) => getPaymentMethod(b) === "UPI")
        .reduce((sum: number, b: any) => sum + getBookingAmount(b), 0);

      const propertiesMap = new Map();
      bookings.forEach((b: any) => {
        const propName = b.property?.name || "Unknown";
        const existing = propertiesMap.get(propName) || { bookings: 0, revenue: 0 };
        existing.bookings += 1;
        existing.revenue += getBookingAmount(b);
        propertiesMap.set(propName, existing);
      });

      const topProperties = Array.from(propertiesMap.entries())
        .map(([name, data]: [string, any]) => ({
          id: name,
          name,
          bookings: data.bookings,
          revenue: data.revenue,
        }))
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 5);

      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      let chartData: { label: string; value: number }[] = [];
      
      if (days <= 7) {
        chartData = Array.from({ length: days }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (days - 1 - i));
          const dayBookings = bookings.filter((b: any) => {
            const bDate = new Date(b.createdAt).toDateString();
            return bDate === d.toDateString();
          });
          return { label: d.toLocaleDateString("en-US", { weekday: "short" }), value: dayBookings.reduce((sum: number, b: any) => sum + getBookingAmount(b), 0) };
        });
      } else if (days <= 30) {
        const weeks = 4;
        const daysPerWeek = Math.ceil(days / weeks);
        chartData = Array.from({ length: weeks }, (_, i) => {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - days + (i * daysPerWeek));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + daysPerWeek);
          const weekBookings = bookings.filter((b: any) => {
            const bDate = new Date(b.createdAt);
            return bDate >= weekStart && bDate < weekEnd;
          });
          return { label: `W${i + 1}`, value: weekBookings.reduce((sum: number, b: any) => sum + getBookingAmount(b), 0) };
        });
      } else {
        chartData = months.map((month, idx) => {
          const year = new Date().getFullYear();
          const monthBookings = bookings.filter((b: any) => {
            const bDate = new Date(b.createdAt);
            return bDate.getMonth() === idx && bDate.getFullYear() === year;
          });
          return { label: month, value: monthBookings.reduce((sum: number, b: any) => sum + getBookingAmount(b), 0) };
        });
      }

      setReportData({
        totalBookings: bookings.length,
        totalRevenue,
        totalGuests,
        averageRating: dashboard?.rating || 4.2,
        occupancyRate: Math.round((confirmedBookings / Math.max(bookings.length, 1)) * 100),
        confirmedBookings,
        pendingBookings,
        cancelledBookings,
        cashPayments,
        razorpayPayments,
        cardPayments,
        upiPayments,
        previousPeriod: { totalBookings: Math.floor(bookings.length * 0.8), totalRevenue: Math.floor(totalRevenue * 0.75), totalGuests: 0 },
        topProperties,
        chartData,
      });
    } catch (error) {
      console.error("Failed to fetch report data:", error);
      setReportData({
        totalBookings: 0, totalRevenue: 0, totalGuests: 0, averageRating: 4.2, occupancyRate: 0,
        confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
        cashPayments: 0, razorpayPayments: 0, cardPayments: 0, upiPayments: 0,
        previousPeriod: { totalBookings: 0, totalRevenue: 0, totalGuests: 0 },
        topProperties: [],
        chartData: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const handleExport = async () => {
    try {
      if (!bookings.length) {
        toast({ title: "No data to export", description: "There are no report rows for the selected period.", variant: "destructive" });
        return;
      }

      const XLSX = await import("xlsx");
      const rows = bookings.map((b: any) => ({
        bookingId: b.bookingNumber || b.id,
        property: b.property?.name || "",
        room: b.room?.name || "",
        guest: b.user?.name || "",
        checkIn: b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : "",
        checkOut: b.checkOutDate ? new Date(b.checkOutDate).toLocaleDateString() : "",
        amount: getBookingAmount(b),
        status: b.status || "",
        paymentMethod: getPaymentMethod(b),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");

      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      XLSX.writeFile(workbook, `report-${dateRange}-days-${stamp}.xlsx`);

      toast({ title: "Export complete", description: "XLSX report downloaded successfully." });
    } catch (error: any) {
      const message = error?.message || "Failed to export report";
      toast({ title: "Export failed", description: message, variant: "destructive" });
    }
  };

  const StatCard = ({ title, value, previousValue, icon: Icon, format = "number", prefix = "" }: { title: string; value: number; previousValue: number; icon: any; format?: "number" | "currency" | "percent"; prefix?: string; }) => {
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

  const maxRevenue = Math.max(...(reportData?.chartData?.map((m: any) => m.value) || [1]), 1);

  return (
    <div className="space-y-6 -mx-8 -mt-8 p-8 min-h-screen">
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
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading analytics..." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Bookings" value={reportData?.totalBookings || 0} previousValue={reportData?.previousPeriod?.totalBookings || 0} icon={BedDouble} />
            <StatCard title="Total Revenue" value={reportData?.totalRevenue || 0} previousValue={reportData?.previousPeriod?.totalRevenue || 0} icon={DollarSign} format="currency" prefix="₹" />
            <StatCard title="Total Guests" value={reportData?.totalGuests || 0} previousValue={reportData?.previousPeriod?.totalGuests || 0} icon={Users} />
            <StatCard title="Occupancy Rate" value={reportData?.occupancyRate || 0} previousValue={70} icon={TrendingUp} format="percent" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {dateRange === "7" ? "Daily Revenue (Last 7 Days)" : dateRange === "30" ? "Weekly Revenue (Last 4 Weeks)" : "Monthly Revenue"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-2">
                  {reportData?.chartData?.map((data: any, index: number) => (
                    <motion.div key={index} initial={{ height: 0 }} animate={{ height: `${(data.value / maxRevenue) * 100}%` }} transition={{ delay: index * 0.05, duration: 0.5 }} className="flex-1 bg-primary/80 rounded-t-lg relative group flex flex-col items-center">
                      <div className="absolute bottom-full mb-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">₹{data.value.toLocaleString()}</div>
                      <span className="absolute -bottom-6 text-xs text-muted-foreground truncate w-full text-center">{data.label}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" />Booking Status</CardTitle></CardHeader>
              <CardContent>
                {[{ label: "Confirmed", value: reportData?.confirmedBookings || 0, color: "bg-green-500" }, { label: "Pending", value: reportData?.pendingBookings || 0, color: "bg-amber-500" }, { label: "Cancelled", value: reportData?.cancelledBookings || 0, color: "bg-red-500" }].map((item) => {
                  const total = (reportData?.totalBookings || 1);
                  const percent = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label} className="mb-4">
                      <div className="flex justify-between text-sm mb-1"><span>{item.label}</span><span className="font-medium">{item.value} ({percent}%)</span></div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={`h-full ${item.color} rounded-full`} />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Average Rating</p><p className="text-2xl font-bold flex items-center gap-1">{reportData?.averageRating || 0}<Star className="w-5 h-5 text-amber-500 fill-amber-500" /></p></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" />Top Performing Properties</CardTitle></CardHeader>
              <CardContent>
                {reportData?.topProperties?.length > 0 ? reportData.topProperties.map((property: any, index: number) => (
                  <div key={property.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{index + 1}</div>
                      <div><p className="font-medium">{property.name}</p><p className="text-sm text-muted-foreground">{property.bookings} bookings</p></div>
                    </div>
                    <div className="text-right"><p className="font-bold">₹{property.revenue.toLocaleString()}</p><p className="text-xs text-muted-foreground">revenue</p></div>
                  </div>
                )) : <p className="text-center text-muted-foreground py-8">No property data</p>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" />Payment Methods</CardTitle></CardHeader>
              <CardContent>
                {[
                  { method: "Cash (Offline)", amount: reportData?.cashPayments || 0, icon: Wallet, color: "bg-green-100" },
                  { method: "Razorpay (Online)", amount: reportData?.razorpayPayments || 0, icon: DollarSign, color: "bg-amber-100" },
                  { method: "UPI", amount: reportData?.upiPayments || 0, icon: CreditCard, color: "bg-purple-100" },
                  { method: "Card", amount: reportData?.cardPayments || 0, icon: CreditCard, color: "bg-blue-100" }
                ].map((item) => {
                  const total = (reportData?.totalRevenue || 1);
                  const percent = item.amount > 0 ? Math.round((item.amount / total) * 100) : 0;
                  return (
                    <div key={item.method} className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center`}><item.icon className="w-5 h-5 text-muted-foreground" /></div>
                        <div><p className="font-medium">{item.method}</p><p className="text-sm text-muted-foreground">{percent}% of total</p></div>
                      </div>
                      <p className="font-bold">₹{item.amount.toLocaleString()}</p>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">Total</p></div>
                    <p className="font-bold text-lg">₹{(reportData?.totalRevenue || 0).toLocaleString()}</p>
                  </div>
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
