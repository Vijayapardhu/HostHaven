import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Download,
  Loader2,
  FileText,
  Star,
  MessageSquare,
  XCircle,
} from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { handleError } from "@/lib/errorHandler";
import ReviewForm from "@/components/review/ReviewForm";
import { PropertyReviews } from "@/components/review/PropertyReviews";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingDetail {
  id: string;
  bookingNumber: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  extraBeds: number;
  baseAmount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  specialRequests?: string;
  guestDetails?: Array<{
    name: string;
    age: number;
    gender: string;
    idProof?: string;
  }>;
  property: {
    id: string;
    slug?: string;
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    rating?: number;
    reviewCount?: number;
    images: Array<{ url: string }>;
    vendor?: {
      id: string;
      businessName: string;
      user?: {
        id: string;
        name: string;
        email: string;
        phone: string;
      };
    };
  };
  room?: {
    id: string;
    name: string;
    type: string;
    availableRooms?: number;
    totalRooms?: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  payment?: {
    id: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    status: string;
    method?: string;
    amount: number;
    currency: string;
    invoiceId?: string;
    errorCode?: string;
    errorDesc?: string;
    refundId?: string;
    refundedAt?: string;
    createdAt?: string;
    updatedAt?: string;
  };
  paymentStatus?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  actualCheckIn?: string;
  actualCheckOut?: string;
  isReviewed?: boolean;
  vendorNotifiedAt?: string;
  vendorConfirmedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CHECKED_IN: "bg-blue-100 text-blue-800",
  CHECKED_OUT: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const fetchBooking = async () => {
    if (!id || !isAuthenticated) return;

    setIsLoading(true);
    try {
      const data = await api.bookings.getById(id);
      setBooking(data);
    } catch {
      setBooking(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id, isAuthenticated]);

  const handleDownloadInvoice = async () => {
    if (!id) return;

    setIsDownloading(true);
    try {
      const blob = await api.bookings.downloadInvoice(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${booking?.bookingNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      handleError(error, 'invoice');
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const formatDateTime = (d: string) => {
    try {
      return new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return d;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <h1 className="text-2xl font-serif font-bold mb-2">
            Booking Not Found
          </h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find this booking.
          </p>
          <Link to="/bookings">
            <Button variant="gold">View All Bookings</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() -
      new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                Booking Details
              </h1>
              <p className="text-muted-foreground">
                Booking #{booking.bookingNumber}
              </p>
            </div>
            <span
              className={`text-sm px-3 py-1.5 rounded-full font-medium ${statusColors[booking.status] || "bg-gray-100 text-gray-800"}`}
            >
              {booking.status?.replace(/_/g, " ")}
            </span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="w-5 h-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {booking.property?.images?.[0]?.url ? (
                        <img
                          src={booking.property.images[0].url}
                          alt={booking.property.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-serif font-semibold text-lg">
                        {booking.property?.name}
                      </h3>
                      {(booking.property?.rating || booking.property?.reviewCount) && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex items-center gap-0.5 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-medium">{typeof booking.property?.rating === 'number' ? booking.property.rating.toFixed(1) : "N/A"}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({booking.property?.reviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-4 h-4" />
                        {booking.property?.address}, {booking.property?.city},{" "}
                        {booking.property?.state} {booking.property?.pincode}
                      </div>
                    </div>
                  </div>
                  {booking.room && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Room:{" "}
                        <span className="text-foreground font-medium">
                          {booking.room.name}
                        </span>{" "}
                        ({booking.room.type})
                      </p>
                      {booking.room.availableRooms !== undefined && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Available Rooms:{" "}
                          <span className="text-foreground font-medium">
                            {booking.room.availableRooms}
                          </span>
                          {booking.room.totalRooms && booking.room.totalRooms > 1 && (
                            <span className="text-muted-foreground"> / {booking.room.totalRooms}</span>
                          )}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {booking.property?.vendor && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Host Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {booking.property.vendor.businessName || "HostHaven"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>
                        {booking.property.city}, {booking.property.state}
                      </span>
                    </div>
                    {booking.property.vendor.user?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.property.vendor.user.phone}</span>
                      </div>
                    )}
                    {booking.property.vendor.user?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.property.vendor.user.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Stay Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Check-in
                      </p>
                      <p className="font-medium">
                        {formatDate(booking.checkInDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        From 12:00 PM
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Check-out
                      </p>
                      <p className="font-medium">
                        {formatDate(booking.checkOutDate)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Until 11:00 AM
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Duration:{" "}
                      <span className="text-foreground font-medium">
                        {nights} night{nights > 1 ? "s" : ""}
                      </span>
                    </p>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Guests:{" "}
                      <span className="text-foreground font-medium">
                        {booking.adults} Adult{booking.adults > 1 ? "s" : ""}
                      </span>
                      {booking.children > 0
                        ? `, ${booking.children} Child`
                        : ""}
                      {booking.extraBeds > 0
                        ? `, ${booking.extraBeds} Extra Bed${booking.extraBeds > 1 ? "s" : ""}`
                        : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Guest Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.user.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.user.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{booking.user.phone}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Room Charges</span>
                    <span>₹{typeof booking.baseAmount === 'number' ? booking.baseAmount.toLocaleString() : '0'}</span>
                  </div>
                  {booking.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST (12%)</span>
                      <span>₹{typeof booking.taxAmount === 'number' ? booking.taxAmount.toLocaleString() : '0'}</span>
                    </div>
                  )}
                  {booking.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-₹{typeof booking.discountAmount === 'number' ? booking.discountAmount.toLocaleString() : '0'}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                    <span>Total Paid</span>
                    <span>₹{typeof booking.totalAmount === 'number' ? booking.totalAmount.toLocaleString() : '0'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *Inclusive of all taxes
                  </p>
                  {booking.payment && (
                    <div className="pt-3 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Payment Status
                        </span>
                        <span
                          className={
                            booking.payment.status === "COMPLETED"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }
                        >
                          {booking.payment.status}
                        </span>
                      </div>
                      {booking.payment.method && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-muted-foreground">Method</span>
                          <span>{booking.payment.method}</span>
                        </div>
                      )}
                      {booking.payment.razorpayPaymentId && (
                        <div className="flex justify-between text-sm mt-2">
                          <span className="text-muted-foreground">
                            Transaction ID
                          </span>
                          <span className="text-xs font-mono">
                            {booking.payment.razorpayPaymentId}
                          </span>
                        </div>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadInvoice}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Invoice
                  </Button>
                  
                  {booking?.status === "PENDING" || booking?.status === "CONFIRMED" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full">
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancel Booking
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this booking? This action cannot be undone.
                            {booking?.payment?.status === "COMPLETED" && (
                              <p className="mt-2 text-amber-600 font-medium">
                                ⚠️ You will receive a refund for this booking.
                              </p>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              try {
                                await api.bookings.cancel(booking!.id);
                                toast.success("Booking cancelled successfully");
                                fetchBooking();
                              } catch (error: any) {
                                handleError(error, "cancellation");
                              }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, Cancel
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                  
                  <Link to="/bookings" className="block">
                    <Button variant="gold" className="w-full">
                      View All Bookings
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Review Section */}
              {(booking?.status === "CHECKED_OUT" || booking?.status === "COMPLETED") && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500" />
                      Rate Your Stay
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {booking?.isReviewed ? (
                      <div className="text-center py-4">
                        <div className="flex justify-center mb-3">
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-4 py-2 rounded-full">
                            <Star className="w-5 h-5 fill-current" />
                            <span className="font-semibold">Review Submitted!</span>
                          </div>
                        </div>
                        <p className="text-gray-600">Thank you for reviewing this property!</p>
                        <p className="text-sm text-gray-500 mt-2">Your review helps other travelers make informed decisions.</p>
                      </div>
                    ) : showReviewForm ? (
                      <ReviewForm
                        propertyId={booking?.property?.id || ""}
                        bookingId={booking?.id}
                        propertyName={booking?.property?.name || "this property"}
                        onSuccess={() => {
                          setShowReviewForm(false);
                          setBooking(prev => prev ? { ...prev, isReviewed: true } : null);
                        }}
                        onCancel={() => setShowReviewForm(false)}
                      />
                    ) : (
                      <div className="text-center py-4">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 mb-4">Share your experience to help other travelers</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button onClick={() => setShowReviewForm(true)} className="bg-primary">
                            Write a Review
                          </Button>
                          <Link to={`/hotels/${booking?.property?.slug || booking?.property?.id}`}>
                            <Button variant="outline">View Property</Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Property Reviews Preview */}
          {booking?.property?.id && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  What Others Say
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PropertyReviews 
                  propertyId={booking.property.id} 
                  showStats={true}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BookingDetails;
