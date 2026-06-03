import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  FileText,
  Building2,
  BedDouble,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { bookingsService } from "@/lib/bookings";
import { useToast } from "@/hooks/use-toast";

interface BookingDetail {
  id: string;
  bookingNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  totalAmount: number;
  advancePaid: number;
  createdAt: string;
  user: { id: string; name: string; email: string; phone?: string; avatar?: string };
  property: { id: string; name: string; address: string; city: string; state: string; images: { url: string }[] };
  room?: { id: string; name: string; type: string; basePrice: number };
  commissionAmount?: number;
  vendorEarning?: number;
  commissionRate?: number;
}

const VendorBookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const response = await bookingsService.getBookingById(id!);
      setBooking(response as unknown as BookingDetail);
    } catch (error) {
      console.error("Failed to fetch booking:", error);
      toast({ title: "Error", description: "Failed to load booking details", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!confirm("Are you sure you want to check in this guest?")) return;
    setIsActionLoading(true);
    try {
      await bookingsService.checkIn(id!);
      toast({ title: "Guest checked in successfully" });
      fetchBooking();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!confirm("Are you sure you want to check out this guest?")) return;
    setIsActionLoading(true);
    try {
      await bookingsService.checkOut(id!);
      toast({ title: "Guest checked out successfully" });
      fetchBooking();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setIsActionLoading(true);
    try {
      await bookingsService.updateBookingStatus(id!, "CANCELLED");
      toast({ title: "Booking cancelled" });
      fetchBooking();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleViewInvoice = async () => {
    try {
      window.open(`/invoice/${id}`, "_blank");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Booking not found</p>
        <Button variant="link" onClick={() => navigate("/bookings")}>Back to Bookings</Button>
      </div>
    );
  }

  const nights = Math.ceil((new Date(booking.checkOutDate).getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/bookings")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-serif font-bold">Booking #{booking.bookingNumber}</h1>
          <p className="text-muted-foreground">Booked on {new Date(booking.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleViewInvoice}>
            <FileText className="w-4 h-4" />Invoice
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />Export
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {booking.status === "CONFIRMED" && (
          <Button onClick={handleCheckIn} disabled={isActionLoading} className="gap-2">
            <CheckCircle className="w-4 h-4" />Check In Guest
          </Button>
        )}
        {booking.status === "CHECKED_IN" && (
          <Button onClick={handleCheckOut} disabled={isActionLoading} className="gap-2">
            <XCircle className="w-4 h-4" />Check Out Guest
          </Button>
        )}
        {booking.status !== "CANCELLED" && booking.status !== "CHECKED_OUT" && (
          <Button variant="destructive" onClick={handleCancel} disabled={isActionLoading} className="gap-2">
            <XCircle className="w-4 h-4" />Cancel Booking
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  {getStatusBadge(booking.status)}
                  {getPaymentBadge(booking.paymentStatus)}
                </div>
                <Badge variant="outline" className="gap-1">
                  <CreditCard className="w-3 h-3" />
                  {booking.paymentMethod}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">Check-in</span>
                  </div>
                  <p className="font-semibold">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">2:00 PM</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarDays className="w-4 h-4" />
                    <span className="text-sm">Check-out</span>
                  </div>
                  <p className="font-semibold">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">11:00 AM</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Duration</p>
                <p className="font-semibold">{nights} night{nights > 1 ? "s" : ""}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">Guests</p>
                <p className="font-semibold">{booking.adults} Adult{booking.adults > 1 ? "s" : ""}{booking.children > 0 ? `, ${booking.children} Child${booking.children > 1 ? "ren" : ""}` : ""}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted">
                  <img src={booking.property.images[0]?.url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200"} alt={booking.property.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {booking.property.name}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {booking.property.address}, {booking.property.city}, {booking.property.state}
                  </p>
                  {booking.room && (
                    <p className="text-sm flex items-center gap-1 mt-2">
                      <BedDouble className="w-3 h-3" />
                      {booking.room.name} - {booking.room.type}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Guest Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{booking.user.name}</p>
                  <p className="text-sm text-muted-foreground">Guest</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{booking.user.email}</span>
                </div>
                {booking.user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.user.phone}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room Charge</span>
                <span>₹{((booking.totalAmount - (booking.totalAmount * 0.12))).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (12%)</span>
                <span>₹{(booking.totalAmount * 0.12).toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-3 border-t font-semibold">
                <span>Total</span>
                <span>₹{booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Advance Paid</span>
                <span className="text-green-600">₹{booking.advancePaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span>₹{(booking.totalAmount - booking.advancePaid).toLocaleString()}</span>
              </div>
              
              {(booking.vendorEarning ?? 0) > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold text-sm mb-2">Your Earnings</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Booking Amount</span>
                    <span>₹{booking.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Platform Deduction</span>
                    <span className="text-rose-600">-₹{(booking.commissionAmount ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>You Receive</span>
                    <span className="text-emerald-600">₹{(booking.vendorEarning ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorBookingDetail;
