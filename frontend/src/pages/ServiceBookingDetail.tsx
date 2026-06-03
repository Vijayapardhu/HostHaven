import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Clock, Download, Loader2, Briefcase } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { handleError } from "@/lib/errorHandler";

interface ServiceBooking {
  id: string;
  bookingNumber: string;
  serviceName: string;
  serviceCategory: string;
  serviceDate: string;
  serviceTime: string;
  location: string;
  notes?: string;
  advanceAmount: number;
  totalAmount: number;
  remainingAmount: number;
  status: string;
  paymentStatus: string;
  razorpayPaymentId?: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ADVANCE_PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const ServiceBookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<ServiceBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (id) fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const data = await api.serviceBookings.getMyBooking(id!);
      setBooking(data);
    } catch (error) {
      handleError(error, 'booking');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!id) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/v1/services/bookings/my/${id}/invoice?t=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || localStorage.getItem("access_token")}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate invoice: ${response.status} - ${errorText}`);
      }
      const contentType = response.headers.get("content-type");
      console.log("Invoice content-type:", contentType);
      const blob = await response.blob();
      console.log("Invoice blob type:", blob.type, "size:", blob.size);
      
      // Check if it's actually a PDF
      if (!blob.type.includes("pdf")) {
        const text = await blob.text();
        console.error("Non-PDF response:", text);
        throw new Error(`Expected PDF but got: ${blob.type} - ${text.substring(0, 200)}`);
      }
      
      // Use arrayBuffer for more reliable PDF handling
      const arrayBuffer = await blob.arrayBuffer();
      const pdfBlob = new Blob([arrayBuffer], { type: "application/pdf" });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${booking?.bookingNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
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

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold mb-2">Booking not found</h2>
          <Link to="/bookings">
            <Button variant="gold">Back to Bookings</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-8">
        <div className="container mx-auto px-4">
          <button
            onClick={() => navigate("/bookings")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>

          <div className="max-w-3xl mx-auto">
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-6 h-6 text-primary" />
                    <h1 className="text-2xl font-serif font-bold">
                      {booking.serviceName}
                    </h1>
                  </div>
                  <p className="text-muted-foreground">
                    Booking #{booking.bookingNumber}
                  </p>
                </div>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    statusColors[booking.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {booking.status?.replace(/_/g, " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm font-medium">Service Date</span>
                  </div>
                  <p className="font-semibold">{formatDate(booking.serviceDate)}</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Time</span>
                  </div>
                  <p className="font-semibold">{booking.serviceTime}</p>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg md:col-span-2">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Location</span>
                  </div>
                  <p className="font-semibold">{booking.location}</p>
                </div>

                {booking.serviceCategory && (
                  <div className="p-4 bg-muted/30 rounded-lg md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <p className="font-semibold">{booking.serviceCategory}</p>
                  </div>
                )}

                {booking.notes && (
                  <div className="p-4 bg-muted/30 rounded-lg md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="font-semibold">{booking.notes}</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-4">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span>₹{booking.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Advance Paid</span>
                    <span className="text-green-600">-₹{booking.advanceAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t">
                    <span>Remaining Amount</span>
                    <span>₹{booking.remainingAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <Button
                  variant="outline"
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                  className="flex-1"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Download Invoice
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-4 text-center">
                Booked on {formatDate(booking.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ServiceBookingDetail;
