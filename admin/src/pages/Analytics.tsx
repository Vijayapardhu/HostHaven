import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  MapPin,
  XCircle,
  CreditCard,
  Star,
} from "lucide-react";
import { analyticsService, type AnalyticsData } from "../lib/analytics";
import { PageHeader } from "../components/ui/PageHeader";
import { FiltersBar } from "../components/ui/FiltersBar";
import { PageLoader } from "../components/ui/PageLoader";
import { EmptyState } from "../components/ui/EmptyState";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "3m">("30d");
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (
    type: "bookings" | "revenue" | "vendors" | "cancellations",
  ) => {
    setExporting(type);
    try {
      await analyticsService.exportReport(type, timeRange);
      toast.success(`${type} report downloaded successfully.`);
    } catch (err) {
      toast.error("Failed to export report.");
    } finally {
      setExporting(null);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyticsService.getAnalytics(timeRange);
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Unable to load analytics.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const stats = useMemo(() => {
    if (!data) return [];
    return [
      {
        name: "Total Users",
        value: data.totalUsers.toLocaleString(),
        growth: data.userGrowth,
        icon: Users,
        color: "bg-blue-500",
      },
      {
        name: "Total Properties",
        value: data.totalProperties.toLocaleString(),
        growth: data.propertyGrowth,
        icon: Building2,
        color: "bg-emerald-500",
      },
      {
        name: "Total Bookings",
        value: data.totalBookings.toLocaleString(),
        growth: data.bookingGrowth,
        icon: Calendar,
        color: "bg-amber-500",
      },
      {
        name: "Total Revenue",
        value: `₹${data.totalRevenue.toLocaleString()}`,
        growth: data.revenueGrowth,
        icon: DollarSign,
        color: "bg-purple-500",
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track platform performance across bookings and revenue."
      />

      <FiltersBar>
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="h-4 w-4" />
            Updated based on selected time range.
          </div>
          <div className="flex items-center gap-3">
            <select
              value={timeRange}
              onChange={(event) =>
                setTimeRange(event.target.value as "7d" | "30d" | "3m")
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="3m">Last 3 months</option>
            </select>
            <select
              onChange={(e) =>
                handleExport(
                  e.target.value as
                    | "bookings"
                    | "revenue"
                    | "vendors"
                    | "cancellations",
                )
              }
              disabled={exporting !== null}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
            >
              <option value="">Export Report</option>
              <option value="bookings">Bookings CSV</option>
              <option value="revenue">Revenue CSV</option>
              <option value="vendors">Vendors CSV</option>
              <option value="cancellations">Cancellations CSV</option>
            </select>
          </div>
        </div>
      </FiltersBar>

      {isLoading ? (
        <PageLoader rows={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load analytics"
          description={error}
          action={
            <button
              type="button"
              onClick={fetchAnalytics}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          }
        />
      ) : !data ? (
        <EmptyState
          title="No analytics data"
          description="Analytics will appear once bookings and revenue are recorded."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              const isPositive = stat.growth >= 0;
              return (
                <Card key={stat.name}>
                  <CardContent className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{stat.name}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {stat.value}
                      </p>
                      <div
                        className={`mt-1 flex items-center gap-1 text-sm ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {isPositive ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                        {Math.abs(stat.growth)}%
                      </div>
                    </div>
                    <div className={`${stat.color} rounded-xl p-3 text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bookings trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end justify-between gap-2">
                  {data.bookingsByMonth.map((item) => (
                    <div key={item.month} className="flex-1">
                      <div
                        className="w-full rounded-t-lg bg-slate-900"
                        style={{
                          height: `${Math.max(
                            8,
                            (item.count /
                              Math.max(
                                ...data.bookingsByMonth.map((b) => b.count),
                                1,
                              )) *
                              100,
                          )}%`,
                        }}
                      />
                      <p className="mt-2 text-center text-xs text-slate-500">
                        {item.month}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-end justify-between gap-2">
                  {data.revenueByMonth.map((item) => (
                    <div key={item.month} className="flex-1">
                      <div
                        className="w-full rounded-t-lg bg-emerald-500"
                        style={{
                          height: `${Math.max(
                            8,
                            (item.amount /
                              Math.max(
                                ...data.revenueByMonth.map((r) => r.amount),
                                1,
                              )) *
                              100,
                          )}%`,
                        }}
                      />
                      <p className="mt-2 text-center text-xs text-slate-500">
                        {item.month}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top performing properties</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topProperties.map((property, index) => (
                    <TableRow key={`${property.name}-${index}`}>
                      <TableCell>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                          {index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {property.name}
                      </TableCell>
                      <TableCell>{property.bookings}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        ₹{property.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Bookings by City */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                Bookings by City
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.bookingsByCity?.map((item, index) => (
                    <TableRow key={`${item.city}-${index}`}>
                      <TableCell className="font-semibold text-slate-900">
                        {item.city}
                      </TableCell>
                      <TableCell>{item.bookings}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        ₹{item.revenue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data.bookingsByCity ||
                    data.bookingsByCity.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-slate-500"
                      >
                        No city data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Vendor Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                Vendor Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.vendorPerformance?.map((vendor, index) => (
                    <TableRow key={`${vendor.name}-${index}`}>
                      <TableCell className="font-semibold text-slate-900">
                        {vendor.name}
                      </TableCell>
                      <TableCell>{vendor.bookings}</TableCell>
                      <TableCell className="font-semibold text-emerald-600">
                        ₹{vendor.revenue.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                          {vendor.rating.toFixed(1)}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {vendor.responseTime}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!data.vendorPerformance ||
                    data.vendorPerformance.length === 0) && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-slate-500"
                      >
                        No vendor data available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Cancellation Stats */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-rose-500" />
                  Cancellation Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-rose-50 p-4">
                  <div>
                    <p className="text-sm text-rose-600">Total Cancellations</p>
                    <p className="text-2xl font-bold text-rose-700">
                      {data.cancellationStats?.total ?? 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-rose-600">Cancellation Rate</p>
                    <p className="text-2xl font-bold text-rose-700">
                      {data.cancellationStats?.rate ?? 0}%
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    By Reason
                  </p>
                  <div className="space-y-2">
                    {data.cancellationStats?.byReason?.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-600">
                          {item.reason}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {item.count}
                        </span>
                      </div>
                    ))}
                    {(!data.cancellationStats?.byReason ||
                      data.cancellationStats.byReason.length === 0) && (
                      <p className="text-sm text-slate-500">
                        No cancellation data.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Failure Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-amber-500" />
                  Payment Failure Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-amber-50 p-4">
                  <div>
                    <p className="text-sm text-amber-600">Total Failures</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {data.paymentFailureStats?.total ?? 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-amber-600">Failure Rate</p>
                    <p className="text-2xl font-bold text-amber-700">
                      {data.paymentFailureStats?.rate ?? 0}%
                    </p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    By Reason
                  </p>
                  <div className="space-y-2">
                    {data.paymentFailureStats?.byReason?.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm text-slate-600">
                          {item.reason}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {item.count}
                        </span>
                      </div>
                    ))}
                    {(!data.paymentFailureStats?.byReason ||
                      data.paymentFailureStats.byReason.length === 0) && (
                      <p className="text-sm text-slate-500">
                        No payment failure data.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
