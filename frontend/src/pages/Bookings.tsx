import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Calendar, MapPin, Loader2, Briefcase, Star, Clock, CheckCircle, XCircle, Home, Ticket } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { handleError } from "@/lib/errorHandler";

interface Booking {
  id: string;
  bookingNumber: string;
  type: "property" | "service";
  property?: {
    id: string;
    name: string;
    city?: string;
    images?: Array<{ url: string }>;
  };
  service?: {
    name: string;
    category: string;
  };
  room?: { id: string; name: string };
  checkInDate?: string;
  checkOutDate?: string;
  serviceDate?: string;
  serviceTime?: string;
  location?: string;
  totalAmount: number;
  advanceAmount?: number;
  status: string;
  createdAt: string;
  isReviewed?: boolean;
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  PENDING: { color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", icon: Clock },
  CONFIRMED: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle },
  ADVANCE_PAID: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: CheckCircle },
  COMPLETED: { color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle },
  CHECKED_IN: { color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: Home },
  CHECKED_OUT: { color: "text-gray-700", bg: "bg-gray-50 border-gray-200", icon: CheckCircle },
  CANCELLED: { color: "text-red-700", bg: "bg-red-50 border-red-200", icon: XCircle },
  REFUNDED: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: XCircle },
};

const tabs = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "CHECKED_IN", label: "Checked In" },
  { key: "CHECKED_OUT", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
];

const Bookings = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const statusFilter = searchParams.get("status") || "all";

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);

    // First fetch all bookings for accurate counts
    Promise.all([
      api.bookings.getMy({ limit: "100" }),
      api.serviceBookings.getMy({ limit: "100" })
    ])
      .then(([propertyResult, serviceResult]) => {
        const propertyBookings = (propertyResult.data || []).map((b: any) => ({
          ...b,
          type: "property" as const
        }));
        
        const serviceBookings = ((serviceResult as any) || []).map((b: any) => ({
          ...b,
          type: "service" as const
        }));

        const allBookingsList = [...propertyBookings, ...serviceBookings].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setAllBookings(allBookingsList);

        // Filter locally based on status
        let filteredBookings = allBookingsList;
        if (statusFilter !== "all" && statusFilter) {
          filteredBookings = allBookingsList.filter(b => b.status === statusFilter);
        }

        // Paginate
        const pageSize = 12;
        const startIndex = (page - 1) * pageSize;
        const paginatedBookings = filteredBookings.slice(startIndex, startIndex + pageSize);
        
        setBookings(paginatedBookings);
        setTotalPages(Math.ceil(filteredBookings.length / pageSize) || 1);
      })
      .catch(() => {
        setBookings([]);
        setAllBookings([]);
      })
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, statusFilter, page]);

  const handleTabChange = (status: string) => {
    setPage(1);
    if (status === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
    }
    setSearchParams(searchParams);
  };

  if (!user) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Your Bookings</h1>
          <p className="text-gray-500 mb-8 text-center max-w-md">
            Log in to view your booking history, track reservations, and manage your upcoming stays.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Login to View Bookings
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return allBookings.length;
    return allBookings.filter(b => b.status === status).length;
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-gray-500">Manage your hotel stays and service bookings</p>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            {tabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              const count = getStatusCount(tab.key);
              const showCount = count > 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  {tab.label}
                  {showCount && (
                    <span className={`text-xs ${isActive ? "bg-white/20" : "bg-gray-100"} px-1.5 py-0.5 rounded-full`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h2>
              <p className="text-gray-500 mb-8">
                {statusFilter === "all" 
                  ? "You haven't made any bookings yet" 
                  : `No ${statusFilter.toLowerCase().replace("_", " ")} bookings`}
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/hotels">
                  <Button className="bg-primary">Book a Hotel</Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline">Browse Services</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => {
                  const status = statusConfig[booking.status] || statusConfig.PENDING;
                  const StatusIcon = status.icon;
                  
                  return (
                    <Link
                      key={booking.id}
                      to={booking.type === "service" ? `/service-bookings/${booking.id}` : `/bookings/${booking.id}`}
                      className="group bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
                    >
                      {/* Image */}
                      <div className="relative h-40 bg-gray-100">
                        {booking.type === "service" ? (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <Briefcase className="w-16 h-16 text-primary/40" />
                          </div>
                        ) : booking.property?.images?.[0]?.url ? (
                          <img
                            src={booking.property.images[0].url}
                            alt={booking.property.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-50">
                            <Home className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color} flex items-center gap-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {booking.status.replace(/_/g, " ")}
                        </div>

                        {/* Type Badge */}
                        <div className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white flex items-center gap-1">
                          {booking.type === "service" ? <Ticket className="w-3 h-3" /> : <Home className="w-3 h-3" />}
                          {booking.type === "service" ? "Service" : "Hotel"}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate group-hover:text-primary transition-colors">
                          {booking.type === "service" 
                            ? booking.service?.name || "Service Booking"
                            : booking.property?.name || "Property"
                          }
                        </h3>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
                          <MapPin className="w-3.5 h-3.5" />
                          {booking.type === "service" ? booking.location || "Location" : booking.property?.city || "City"}
                        </div>

                        {/* Dates/Time */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {booking.type === "service" ? (
                            <span>{formatDate(booking.serviceDate || booking.createdAt)}</span>
                          ) : (
                            <span>
                              {formatDate(booking.checkInDate || "")} - {formatDate(booking.checkOutDate || "")}
                            </span>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="font-bold text-lg text-gray-900">
                            {formatPrice(booking.totalAmount)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {booking.bookingNumber}
                          </span>
                        </div>

                        {/* Review Prompt */}
                        {(booking.status === "CHECKED_OUT" || booking.status === "COMPLETED") && !booking.isReviewed && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="w-4 h-4 fill-current" />
                              <span className="text-sm font-medium">Rate this stay</span>
                            </div>
                            <span className="text-primary text-sm font-medium">→</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 md:gap-4 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => {
                      setPage((p) => p - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 md:px-6"
                  >
                    Prev
                  </Button>
                  <div className="flex items-center gap-1 md:gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setPage(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-sm font-medium transition-all ${
                            page === pageNum
                              ? "bg-primary text-white"
                              : "bg-white text-gray-600 hover:bg-gray-100 border"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => {
                      setPage((p) => p + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 md:px-6"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookings;
