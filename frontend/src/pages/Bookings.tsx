import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Loader2 } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface Booking {
  id: string;
  bookingNumber: string;
  property?: {
    id: string;
    name: string;
    city?: string;
    images?: Array<{ url: string }>;
  };
  room?: { id: string; name: string };
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const Bookings = () => {
  const { user, isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    api.bookings
      .getMy({ page: page.toString(), limit: "10" })
      .then((result) => {
        setBookings(result.data || []);
        setTotalPages(result.meta?.totalPages || 1);
      })
      .catch(() => setBookings([]))
      .finally(() => setIsLoading(false));
  }, [isAuthenticated, page]);

  if (!user) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">Please log in</h1>
          <p className="text-muted-foreground mb-6">Log in to view your bookings</p>
          <Link to="/login"><Button variant="gold">Login</Button></Link>
        </div>
      </Layout>
    );
  }

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return d; }
  };

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6">My Bookings</h1>

          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No bookings yet</h2>
              <p className="text-muted-foreground mb-6">Start exploring and book your first stay!</p>
              <Link to="/hotels"><Button variant="gold">Browse Hotels</Button></Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-card rounded-xl shadow-card p-4 md:p-6 flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-40 h-32 md:h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {booking.property?.images?.[0]?.url ? (
                      <img src={booking.property.images[0].url} alt={booking.property.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-serif font-semibold text-lg truncate">{booking.property?.name || "Property"}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[booking.status] || "bg-gray-100 text-gray-800"}`}>
                        {booking.status?.replace(/_/g, " ")}
                      </span>
                    </div>
                    {booking.property?.city && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-3.5 h-3.5" />{booking.property.city}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <span>Booking: {booking.bookingNumber}</span>
                      <span>Check-in: {formatDate(booking.checkInDate)}</span>
                      <span>Check-out: {formatDate(booking.checkOutDate)}</span>
                      {booking.room?.name && <span>Room: {booking.room.name}</span>}
                    </div>
                    <div className="mt-2 font-semibold text-foreground">₹{booking.totalAmount?.toLocaleString()}</div>
                  </div>
                </div>
              ))}

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <span className="text-sm text-muted-foreground flex items-center">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Bookings;
