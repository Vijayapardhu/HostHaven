import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookingsService } from "@/lib/bookings";
import LoadingState from "@/components/states/LoadingState";
import EmptyState from "@/components/states/EmptyState";
import ErrorState from "@/components/states/ErrorState";

interface BookingRecord {
  id: string;
  bookingNumber?: string;
  user?: { name: string; email: string };
  property?: { name: string; city: string };
  checkInDate: string;
  checkOutDate: string;
  adults?: number;
  children?: number;
  totalAmount?: number;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
  commissionAmount?: number;
  vendorEarning?: number;
  commissionRate?: number;
}

const VendorBookingsIndex = () => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBookings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: Record<string, string> = {
        page: currentPage.toString(),
        limit: "10",
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

const response = await bookingsService.getBookings(params);
      const bookingList = (Array.isArray(response.data) ? response.data : []) as BookingRecord[];
      setBookings(bookingList);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error: any) {
      setErrorMessage(error?.message || "Failed to load bookings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [currentPage, statusFilter]);

  const filteredBookings = bookings.filter((booking) => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      booking.bookingNumber?.toLowerCase().includes(query) ||
      booking.user?.name?.toLowerCase().includes(query) ||
      booking.property?.name?.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      CONFIRMED: { label: "Confirmed", className: "bg-green-100 text-green-700" },
      PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
      CHECKED_IN: { label: "Checked In", className: "bg-blue-100 text-blue-700" },
      CHECKED_OUT: { label: "Checked Out", className: "bg-gray-100 text-gray-700" },
    };

    const config = statusMap[status] || { label: status, className: "" };

    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage and track all bookings</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search bookings..."
            className="pl-9"
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

      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState className="p-8" message="Loading bookings..." />
          ) : errorMessage ? (
            <ErrorState className="p-8" title="Unable to load bookings" description={errorMessage} onRetry={loadBookings} />
          ) : filteredBookings.length === 0 ? (
            <EmptyState
              className="py-12"
              icon={<CalendarDays className="w-12 h-12 text-muted" />}
              title="No bookings found"
              description="Bookings will appear here once guests make reservations."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-semibold">Booking ID</th>
                    <th className="text-left p-4 font-semibold">Guest</th>
                    <th className="text-left p-4 font-semibold">Hotel</th>
                    <th className="text-left p-4 font-semibold">Dates</th>
                    <th className="text-left p-4 font-semibold">Total Amount</th>
                    <th className="text-left p-4 font-semibold">Your Earnings</th>
                    <th className="text-left p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <p className="font-mono font-medium text-sm">{booking.bookingNumber || booking.id}</p>
                        {booking.createdAt && (
                          <p className="text-xs text-muted-foreground">{new Date(booking.createdAt).toLocaleDateString()}</p>
                        )}
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{booking.user?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{booking.user?.email || ""}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{booking.property?.name || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">{booking.property?.city || ""}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">to {new Date(booking.checkOutDate).toLocaleDateString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-bold">₹{(booking.totalAmount || 0).toLocaleString()}</p>
                      </td>
                      <td className="p-4">
                        {(booking.vendorEarning ?? 0) > 0 ? (
                          <p className="font-bold text-emerald-600">₹{(booking.vendorEarning || 0).toLocaleString()}</p>
                        ) : (
                          <p className="text-muted-foreground">—</p>
                        )}
                      </td>
                      <td className="p-4">{getStatusBadge(booking.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

export default VendorBookingsIndex;
