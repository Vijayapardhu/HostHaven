import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicPlatformSettings } from "@/hooks/usePublicPlatformSettings";
import { api } from "@/lib/api";
import { createBookingPayment } from "@/lib/razorpay";

interface PropertyRoom {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
}

interface PropertyData {
  id: string;
  name: string;
  basePrice: number;
  currency?: string;
  rooms?: PropertyRoom[];
}

const BookingCheckout = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const platformSettings = usePublicPlatformSettings();

  const [property, setProperty] = useState<PropertyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const roomId = searchParams.get("roomId") || "";
  const checkInIso = searchParams.get("checkIn") || "";
  const checkOutIso = searchParams.get("checkOut") || "";
  const guests = Number(searchParams.get("guests") || "1");
  const fullName = searchParams.get("guestName") || "";
  const phone = searchParams.get("guestPhone") || "";

  const checkIn = checkInIso ? new Date(checkInIso) : undefined;
  const checkOut = checkOutIso ? new Date(checkOutIso) : undefined;

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    api.properties
      .getById(id)
      .then((data) => setProperty(data))
      .catch(() => {
        toast({
          title: "Unable to load checkout",
          description: "Please restart your booking.",
          variant: "destructive",
        });
        navigate(`/booking/${id}/review?${searchParams.toString()}`);
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate, toast]);

  const selectedRoom = useMemo(
    () => property?.rooms?.find((room) => room.id === roomId) || property?.rooms?.[0],
    [property, roomId]
  );

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, [checkIn, checkOut]);

  const roomPrice = selectedRoom?.pricePerNight || property?.basePrice || 0;
  const totalAmount = roomPrice * nights;
  
  const taxEnabled = platformSettings.tax?.enabled ?? false;
  const taxPercent = platformSettings.tax?.percent ?? 12;
  const taxAmount = taxEnabled ? Math.round(totalAmount * (taxPercent / 100)) : 0;
  const grandTotal = totalAmount + taxAmount;

  const handlePay = async () => {
    if (!id || !property || !selectedRoom?.id || !checkIn || !checkOut || nights <= 0) {
      toast({
        title: "Invalid booking details",
        description: "Please restart booking and try again.",
        variant: "destructive",
      });
      return;
    }

    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to continue with payment.",
        variant: "destructive",
      });
      setTimeout(() => {
        navigate("/login", { state: { from: window.location.pathname + window.location.search } });
      }, 900);
      return;
    }

    setIsProcessingPayment(true);
    let bookingId: string | undefined;
    let lockAcquired = false;

    try {
      await api.inventory.lock({
        roomId: selectedRoom.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        quantity: 1,
      });
      lockAcquired = true;

      const bookingResponse = await api.bookings.create({
        propertyId: property.id,
        roomId: selectedRoom.id,
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        adults: guests,
        children: 0,
        extraBeds: 0,
        specialRequests: [fullName, phone].filter(Boolean).join(" | ") || undefined,
      });

      bookingId = bookingResponse?.booking?.id || bookingResponse?.id;
      if (!bookingId) {
        throw new Error("Booking creation failed");
      }

      const order = await api.payments.createOrder(bookingId);

      const result = await createBookingPayment({
        propertyName: `${property.name} - ${selectedRoom.name}`,
        amount: grandTotal,
        nights,
        checkIn: format(checkIn, "MMM dd, yyyy"),
        checkOut: format(checkOut, "MMM dd, yyyy"),
        guests,
        orderId: order.orderId,
        keyId: order.keyId,
        userName: fullName,
        userPhone: phone,
        userEmail: user?.email || "",
        notes: {
          propertyId: property.id,
          roomId: selectedRoom.id,
        },
      });

      if (!result.success) {
        throw new Error(result.error || "Payment failed");
      }

      const paymentResp = result.response as any;
      if (paymentResp?.razorpay_order_id && paymentResp?.razorpay_payment_id && paymentResp?.razorpay_signature) {
        await api.payments.verify({
          razorpay_order_id: paymentResp.razorpay_order_id,
          razorpay_payment_id: paymentResp.razorpay_payment_id,
          razorpay_signature: paymentResp.razorpay_signature,
        });
      }

      toast({
        title: "Booking successful",
        description: `Your stay at ${property.name} is confirmed.`,
      });

      const successParams = new URLSearchParams({
        property: property.name,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guestName: fullName || "Guest",
      });
      if (bookingId) {
        successParams.set("bookingId", bookingId);
      }
      navigate(`/booking/${property.id}/processing?${successParams.toString()}`);
    } catch (error: any) {
      if (bookingId) {
        await api.bookings.cancel(bookingId, "Payment failed");
      }
      if (lockAcquired) {
        await api.inventory.release({ roomId: selectedRoom?.id || roomId });
      }
      toast({
        title: "Booking failed",
        description: error?.message || "Unable to complete payment.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading || !property) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Loading checkout...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-10 booking-step-enter">
        <Link to={`/booking/${id}/review?${searchParams.toString()}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to booking review
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Step 3 of 4</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold">Checkout</h1>
            <p className="text-muted-foreground mt-1">Review and complete your payment</p>

            <Card className="mt-6">
              <CardContent className="p-5 md:p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary Guest</p>
                    <p className="font-semibold text-lg mt-1">{fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground text-left md:text-right">Phone Number</p>
                    <p className="font-semibold text-lg mt-1">{phone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="p-5 md:p-6 space-y-3">
                <h2 className="text-lg font-semibold">Price details</h2>
                <p className="text-sm text-muted-foreground">{property.name}</p>
                <p className="text-sm">{selectedRoom?.name || "Room"}</p>
                <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t">
                  <p>Check-in: {checkIn ? format(checkIn, "MMM dd, yyyy") : "-"}</p>
                  <p>Check-out: {checkOut ? format(checkOut, "MMM dd, yyyy") : "-"}</p>
                  <p>Guests: {guests}</p>
                </div>
                <div className="pt-2 border-t text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>₹{roomPrice.toLocaleString()} x {nights} night{nights > 1 ? "s" : ""}</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                  {taxEnabled && (
                    <>
                      <div className="flex justify-between text-muted-foreground">
                        <span>GST ({taxPercent}%)</span>
                        <span>₹{taxAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>CGST ({(taxPercent / 2).toFixed(1)}%)</span>
                        <span>₹{Math.round(taxAmount / 2).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>SGST ({(taxPercent / 2).toFixed(1)}%)</span>
                        <span>₹{Math.round(taxAmount / 2).toLocaleString()}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-1 border-t">
                    <span>Total</span>
                    <span>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                <Button className="w-full" size="lg" onClick={handlePay} disabled={isProcessingPayment || nights <= 0}>
                  {isProcessingPayment ? "Processing payment..." : `Pay ₹${grandTotal.toLocaleString()} & confirm booking`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookingCheckout;
