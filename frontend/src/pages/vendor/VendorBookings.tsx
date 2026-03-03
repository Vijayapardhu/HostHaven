import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";

interface Booking {
  id: string;
  bookingNumber: string;
  user: { id: string; name: string; email: string; phone?: string };
  property: { id: string; name: string; city: string };
  room?: { id: string; name: string };
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const VendorBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBookings();
  }, [currentPage, statusFilter]);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: "10",
      };
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const response = await api.vendor.getBookings(params);
      setBookings(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Confirmed</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-700"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-700"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      case "CHECKED_IN":
        return <Badge className="bg-blue-100 text-blue-700"><Users className="w-3 h-3 mr-1" />Checked In</Badge>;
      case "CHECKED_OUT":
        return <Badge className="bg-gray-100 text-gray-700">Checked Out</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Paid</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">Pending</Badge>;
      case "REFUNDED":
        return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredBookings = bookings.filter(
    (b) =>
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.property.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your bookings
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length, color: "bg-primary/10" },
          { label: "Confirmed", value: bookings.filter(b => b.status === "CONFIRMED").length, color: "bg-green-50" },
          { label: "Pending", value: bookings.filter(b => b.status === "PENDING").length, color: "bg-amber-50" },
          { label: "Cancelled", value: bookings.filter(b => b.status === "CANCELLED").length, color: "bg-red-50" },
        ].map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by booking ID, guest name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CHECKED_IN">Checked In</SelectItem>
            <SelectItem value="CHECKED_OUT">Checked Out</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bookings Table */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filteredBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Booking ID</th>
                    <th className="text-left p-4 font-semibold">Guest</th>
                    <th className="text-left p-4 font-semibold">Hotel</th>
                    <th className="text-left p-4 font-semibold">Dates</th>
                    <th className="text-left p-4 font-semibold">Amount</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                    <th className="text-left p-4 font-semibold">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking, index) => (
                    <motion.tr
                      key={booking.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-mono font-medium">{booking.bookingNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{booking.user.name}</p>
                        <p className="text-sm text-muted-foreground">{booking.user.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{booking.property.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {booking.property.city}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p>{new Date(booking.checkInDate).toLocaleDateString()}</p>
                            <p className="text-muted-foreground">to {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {booking.adults} Adults, {booking.children} Children
                        </p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold">₹{booking.totalAmount.toLocaleString()}</p>
                      </td>
                      <td className="p-4">{getStatusBadge(booking.status)}</td>
                      <td className="p-4">{getPaymentBadge(booking.paymentStatus)}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDays className="w-12 h-12 text-muted mx-auto mb-4" />
              <p className="text-muted-foreground">No bookings found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorBookings;
